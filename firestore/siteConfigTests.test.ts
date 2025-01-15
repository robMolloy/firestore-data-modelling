import { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, query, collection, getDocs } from "firebase/firestore";
import { collectionNames, siteConfig1, TSiteConfig, TSiteConfigKey } from "./firestoreTestMocks";
import {
  createTestEnvironment,
  isRequestDenied,
  isRequestGranted,
  setDefaultLogLevel,
} from "./utils/firestoreTestUtils";
import { creatifyDoc, getNotNowTimestamp, removeKey } from "./utils/firestoreUtils";
let testEnv: RulesTestEnvironment;

describe(`firestore rules for ${collectionNames.siteConfig} collection`, () => {
  beforeAll(async () => {
    setDefaultLogLevel();
    testEnv = await createTestEnvironment();
  });
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it(`SC.G.0.A should grant get access to ${collectionNames.siteConfig} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.siteConfig, siteConfig1.id);
      await setDoc(docRef, siteConfig1);
    });

    const adminDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const adminDocRef = doc(adminDb, collectionNames.siteConfig, siteConfig1.id);

    const notAdminDb = testEnv.authenticatedContext(`not_${siteConfig1.adminUids[0]}`).firestore();
    const notAdminDocRef = doc(notAdminDb, collectionNames.siteConfig, siteConfig1.id);

    const promises = [
      isRequestGranted(getDoc(adminDocRef)),
      isRequestGranted(getDoc(notAdminDocRef)),
    ];
    const responses = await Promise.all(promises);
    responses.forEach((response) => {
      expect(response.permissionGranted).toBe(true);
      expect(response.data).toEqual(siteConfig1);
    });
  });

  it(`SC.G.1.D should deny unauthenticated get access to ${collectionNames.siteConfig} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.siteConfig, siteConfig1.id);
      await setDoc(docRef, siteConfig1);
    });

    const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
    const adminDocRef = doc(unauthenticatedDb, collectionNames.siteConfig, siteConfig1.id);

    const response = await isRequestDenied(getDoc(adminDocRef));
    expect(response.permissionDenied).toBe(true);
  });

  it(`SC.L.0.D should deny list access to a ${collectionNames.siteConfig} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const siteConfigDocRef = doc(context.firestore(), collectionNames.siteConfig, siteConfig1.id);
      await setDoc(siteConfigDocRef, siteConfig1);
    });

    const ownerDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const notOwnerDb = testEnv.authenticatedContext(`not_${siteConfig1.adminUids[0]}`).firestore();
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const queries = [
      query(collection(ownerDb, collectionNames.siteConfig)),
      query(collection(notOwnerDb, collectionNames.siteConfig)),
      query(collection(unauthedDb, collectionNames.siteConfig)),
    ];
    const promises = queries.map((q) => isRequestDenied(getDocs(q)));
    const responses = await Promise.all(promises);
    const isAllDenied = responses.every((x) => x.permissionDenied);
    expect(isAllDenied).toBe(true);
  });

  it(`SC.C.0.A should allow create access if user is authenticated and data is valid to ${collectionNames.siteConfig}`, async () => {
    const authedDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.siteConfig, siteConfig1.id);

    const createDocResult = await isRequestGranted(setDoc(docRef, creatifyDoc(siteConfig1)));

    expect(createDocResult.permissionGranted).toBe(true);
  });

  it(`SC.C.1.D should deny create access if missing key to ${collectionNames.siteConfig}`, async () => {
    const authedDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.siteConfig, siteConfig1.id);

    const createDocKeys = Object.keys(siteConfig1) as TSiteConfigKey[];

    const missingKeyDocs = createDocKeys.map((key) => removeKey(key, creatifyDoc(siteConfig1)));
    const promises = missingKeyDocs.map((doc1) => isRequestDenied(setDoc(docRef, doc1)));
    const results = await Promise.all(promises);
    const isAllDenied = results.every((x) => x.permissionDenied);
    expect(isAllDenied).toBe(true);
  });

  it(`SC.C.2.D should deny create access if additional key to ${collectionNames.siteConfig}`, async () => {
    const authedDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.siteConfig, siteConfig1.id);

    const additionalKeyDoc = { ...creatifyDoc(siteConfig1), another: "key" };
    const result = await isRequestDenied(setDoc(docRef, additionalKeyDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`SC.C.3.D should deny access if getIncomingId() != incoming.id to ${collectionNames.siteConfig}`, async () => {
    const authedDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.siteConfig, siteConfig1.id);

    const mismatchIdDoc = { ...creatifyDoc(siteConfig1), id: `not_${siteConfig1.id}` };
    const result = await isRequestDenied(setDoc(docRef, mismatchIdDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`SC.C.4.D should deny access if incoming.id != "unique" to ${collectionNames.siteConfig}`, async () => {
    const invalidId = "not_unique";
    const authedDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.siteConfig, invalidId);

    const additionalKeyDoc = { ...creatifyDoc(siteConfig1), id: invalidId };
    const result = await isRequestDenied(setDoc(docRef, additionalKeyDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`SC.C.5.D should deny access if isNotNow(incoming.createdAt) to ${collectionNames.siteConfig}`, async () => {
    const authedDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.siteConfig, siteConfig1.id);

    const notNowCreatedAtDoc = { ...creatifyDoc(siteConfig1), createdAt: getNotNowTimestamp() };
    const result = await isRequestDenied(setDoc(docRef, notNowCreatedAtDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`SC.C.6.D should deny access if isNotNow(incoming.updatedAt) to ${collectionNames.siteConfig}`, async () => {
    const authedDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.siteConfig, siteConfig1.id);

    const notNowUpdatedAtDoc = { ...creatifyDoc(siteConfig1), updatedAt: getNotNowTimestamp() };
    const result = await isRequestDenied(setDoc(docRef, notNowUpdatedAtDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`SC.C.7.D.wrongUser should deny create access if auth.uid is not in incoming.adminUids to ${collectionNames.siteConfig}`, async () => {
    const authedDb = testEnv.authenticatedContext(`not_${siteConfig1.adminUids[0]}`).firestore();
    const docRef = doc(authedDb, collectionNames.siteConfig, siteConfig1.id);

    const createDocResult = await isRequestDenied(setDoc(docRef, creatifyDoc(siteConfig1)));

    expect(createDocResult.permissionDenied).toBe(true);
  });

  it(`SC.C.7.D.unauth should deny create access if user is unauthenticated to ${collectionNames.siteConfig}`, async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.siteConfig, siteConfig1.id);

    const createDocResult = await isRequestDenied(setDoc(docRef, creatifyDoc(siteConfig1)));

    expect(createDocResult.permissionDenied).toBe(true);
  });

  it(`SC.U.0.D should deny update access to ${collectionNames.siteConfig} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.siteConfig, siteConfig1.id);
      await setDoc(docRef, siteConfig1);
    });

    const ownerDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const ownerDocRef = doc(ownerDb, collectionNames.siteConfig, siteConfig1.id);

    const notOwnerDb = testEnv.authenticatedContext(`not_${siteConfig1.adminUids[0]}`).firestore();
    const notOwnerDocRef = doc(notOwnerDb, collectionNames.siteConfig, siteConfig1.id);

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const unauthDocRef = doc(unauthedDb, collectionNames.siteConfig, siteConfig1.id);

    const newSiteConfig = {
      ...siteConfig1,
      adminUids: [...siteConfig1.adminUids, "newUid"],
    } satisfies TSiteConfig;
    const requestFns = [
      () => setDoc(ownerDocRef, newSiteConfig),
      () => setDoc(ownerDocRef, newSiteConfig, { merge: true }),
      () => setDoc(notOwnerDocRef, newSiteConfig),
      () => setDoc(notOwnerDocRef, newSiteConfig, { merge: true }),
      () => setDoc(unauthDocRef, newSiteConfig),
      () => setDoc(unauthDocRef, newSiteConfig, { merge: true }),
    ];

    for (const requestFn of requestFns) {
      const response = await isRequestDenied(requestFn());
      expect(response.permissionDenied).toBe(true);
    }
  });

  it(`SC.D.0.D should deny delete access to a ${collectionNames.siteConfig} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const siteConfigDocRef = doc(context.firestore(), collectionNames.siteConfig, siteConfig1.id);
      await setDoc(siteConfigDocRef, siteConfig1);
    });

    const ownerDb = testEnv.authenticatedContext(siteConfig1.adminUids[0]).firestore();
    const ownerDocRef = doc(ownerDb, collectionNames.siteConfig, siteConfig1.id);

    const notOwnerDb = testEnv.authenticatedContext(`not_${siteConfig1.adminUids[0]}`).firestore();
    const notOwnerDocRef = doc(notOwnerDb, collectionNames.siteConfig, siteConfig1.id);

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const unauthDocRef = doc(unauthedDb, collectionNames.siteConfig, siteConfig1.id);

    const docRefs = [ownerDocRef, notOwnerDocRef, unauthDocRef];
    const promises = docRefs.map((docRef) => isRequestDenied(deleteDoc(docRef)));
    const responses = await Promise.all(promises);
    const isAllDenied = responses.every((x) => x.permissionDenied);
    expect(isAllDenied).toBe(true);
  });
});
