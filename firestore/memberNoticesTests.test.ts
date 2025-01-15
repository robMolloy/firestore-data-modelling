import { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc } from "firebase/firestore";
import { collectionNames, memberNotice1 } from "./firestoreTestMocks";
import * as fsUtils from "./utils/firestoreTestUtils";

let testEnv: RulesTestEnvironment;

describe(`firestore rules for ${collectionNames.memberNotices} collection`, () => {
  beforeAll(async () => {
    fsUtils.setDefaultLogLevel();
    testEnv = await fsUtils.createTestEnvironment();
  });
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });
  afterAll(async () => {
    await testEnv.cleanup();
  });

  it(`MN.G.0.A should allow get if auth.uid != null from ${collectionNames.memberNotices} collection if a user is authenticated `, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.memberNotices, "id1");
      await setDoc(docRef, memberNotice1);
    });

    const authedDb = testEnv.authenticatedContext("anyUid").firestore();
    const docRef2 = doc(authedDb, collectionNames.memberNotices, "id1");
    const response2 = await fsUtils.isRequestGranted(getDoc(docRef2));
    expect(response2.permissionGranted).toBe(true);
    expect(response2.data).toEqual(memberNotice1);
  });

  it(`MN.G.1.D should deny get if auth.uid == null from ${collectionNames.memberNotices}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.memberNotices, "id1");
      await setDoc(docRef, memberNotice1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.memberNotices, "id1");
    const response = await fsUtils.isRequestDenied(getDoc(docRef));
    expect(response.permissionDenied).toBe(true);
  });

  it(`MN.L.0.A should allow list if auth.uid != null from ${collectionNames.memberNotices}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.memberNotices, "id1");
      await setDoc(docRef, memberNotice1);
    });

    const authedDb = testEnv.authenticatedContext("anyUid").firestore();
    const q = query(collection(authedDb, collectionNames.memberNotices));
    const response2 = await fsUtils.isRequestGranted(getDocs(q));
    expect(response2.permissionGranted).toBe(true);
    expect(response2.data).toEqual([memberNotice1]);
  });

  it(`MN.L.1.D should deny list if auth.uid == null from ${collectionNames.memberNotices}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.memberNotices, "id1");
      await setDoc(docRef, memberNotice1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const q = query(collection(unauthedDb, collectionNames.memberNotices));
    const response2 = await fsUtils.isRequestDenied(getDocs(q));
    expect(response2.permissionDenied).toBe(true);
  });

  it(`MN.C.0.D should not allow create access to a ${collectionNames.memberNotices} collection`, async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.memberNotices, "id1");

    const setDocResult = await fsUtils.isRequestDenied(setDoc(docRef, { some: "data2" }));
    expect(setDocResult.permissionDenied).toBe(true);
  });

  it(`MN.U.0.D should deny update access to ${collectionNames.memberNotices} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.memberNotices, "id1");
      await setDoc(docRef, memberNotice1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.memberNotices, "id1");

    const requestFns = [
      () => setDoc(docRef, { some: "data2" }),
      () => setDoc(docRef, { more: "data" }, { merge: true }),
    ];

    for (const requestFn of requestFns) {
      const response = await fsUtils.isRequestDenied(requestFn());
      expect(response.permissionDenied).toBe(true);
    }
  });

  it(`MN.D.0.D should deny delete access to a ${collectionNames.memberNotices} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.memberNotices, "id1");
      await setDoc(docRef, memberNotice1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.memberNotices, "id1");
    const deleteDocResult = await fsUtils.isRequestDenied(deleteDoc(docRef));

    expect(deleteDocResult.permissionDenied).toBe(true);
  });
});
