import { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { getDocs, doc, setDoc, getDoc, deleteDoc, query, collection } from "firebase/firestore";
import { collectionNames, todoGroup1, TTodoGroupKey } from "./firestoreTestMocks";
import {
  createTestEnvironment,
  isRequestDenied,
  isRequestGranted,
  setDefaultLogLevel,
} from "./utils/firestoreTestUtils";
import { creatifyDoc, getNotNowTimestamp, removeKey } from "./utils/firestoreUtils";
let testEnv: RulesTestEnvironment;

describe(`firestore rules for ${collectionNames.todoGroups} collection`, () => {
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

  it(`TG.G.0.A should grant get access to a ${collectionNames.todoGroups} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.todoGroups, todoGroup1.id);
      await setDoc(docRef, todoGroup1);
    });

    const authedDb = testEnv.authenticatedContext(todoGroup1.uids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);
    const response = await isRequestGranted(getDoc(docRef));
    expect(response.permissionGranted).toBe(true);
    expect(response.data).toEqual(todoGroup1);
  });

  it(`TG.L.0.D should deny list access to a ${collectionNames.todoGroups} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.todoGroups, todoGroup1.id);
      await setDoc(docRef, todoGroup1);
    });

    const authedDb = testEnv.authenticatedContext(todoGroup1.uids[0]).firestore();
    const q = query(collection(authedDb, collectionNames.todoGroups));
    const response = await isRequestDenied(getDocs(q));
    expect(response.permissionDenied).toBe(true);
  });

  it(`TG.C.0.A should allow create access if user is authenticated and data is valid to ${collectionNames.todoGroups}`, async () => {
    const authedDb = testEnv.authenticatedContext(todoGroup1.uids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);

    const createDocResult = await isRequestGranted(setDoc(docRef, creatifyDoc(todoGroup1)));

    expect(createDocResult.permissionGranted).toBe(true);
  });

  it(`TG.C.1.D should deny create access if missing key to ${collectionNames.todoGroups}`, async () => {
    const authedDb = testEnv.authenticatedContext(todoGroup1.uids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);

    const createDocKeys = Object.keys(todoGroup1) as TTodoGroupKey[];

    const missingKeyDocs = createDocKeys.map((key) => removeKey(key, creatifyDoc(todoGroup1)));
    const promises = missingKeyDocs.map((todo) => isRequestDenied(setDoc(docRef, todo)));
    const results = await Promise.all(promises);
    const isAllDenied = results.every((x) => x.permissionDenied);
    expect(isAllDenied).toBe(true);
  });

  it(`TG.C.2.D should deny create access if additional key to ${collectionNames.todoGroups}`, async () => {
    const authedDb = testEnv.authenticatedContext(todoGroup1.uids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);

    const additionalKeyDoc = { ...creatifyDoc(todoGroup1), another: "key" };
    const result = await isRequestDenied(setDoc(docRef, additionalKeyDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`TG.C.3.D should deny access if getIncomingId() != incoming.id to ${collectionNames.todoGroups}`, async () => {
    const authedDb = testEnv.authenticatedContext(todoGroup1.uids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);

    const mismatchIdDoc = { ...creatifyDoc(todoGroup1), id: `not_${todoGroup1.id}` };
    const result = await isRequestDenied(setDoc(docRef, mismatchIdDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`TG.C.4.D should deny access if isNotNow(incoming.createdAt) to ${collectionNames.todoGroups}`, async () => {
    const authedDb = testEnv.authenticatedContext(todoGroup1.uids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);

    const notNowCreatedAtDoc = { ...creatifyDoc(todoGroup1), createdAt: getNotNowTimestamp() };
    const result = await isRequestDenied(setDoc(docRef, notNowCreatedAtDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`TG.C.5.D should deny access if isNotNow(incoming.updatedAt) to ${collectionNames.todoGroups}`, async () => {
    const authedDb = testEnv.authenticatedContext(todoGroup1.uids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);

    const notNowUpdatedAtDoc = { ...creatifyDoc(todoGroup1), updatedAt: getNotNowTimestamp() };
    const result = await isRequestDenied(setDoc(docRef, notNowUpdatedAtDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`TG.C.6.D.wrongUser should deny create access if auth.uid not in incoming.uids to ${collectionNames.todoGroups}`, async () => {
    const authedDb = testEnv.authenticatedContext(`not_${todoGroup1.uids[0]}`).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);

    const createDocResult = await isRequestDenied(setDoc(docRef, creatifyDoc(todoGroup1)));

    expect(createDocResult.permissionDenied).toBe(true);
  });

  it(`TG.C.6.D.unauth should deny create access if user is unauthenticated to ${collectionNames.todoGroups}`, async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.todoGroups, todoGroup1.id);

    const createDocResult = await isRequestDenied(setDoc(docRef, creatifyDoc(todoGroup1)));

    expect(createDocResult.permissionDenied).toBe(true);
  });

  it(`TG.U.0.D should deny update access to ${collectionNames.todoGroups} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.todoGroups, todoGroup1.id);
      await setDoc(docRef, todoGroup1);
    });

    const authedDb = testEnv.authenticatedContext(`not_${todoGroup1.uids[0]}`).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);

    const requestFns = [
      () => setDoc(docRef, { some: "data2" }),
      () => setDoc(docRef, { more: "data" }, { merge: true }),
    ];

    for (const requestFn of requestFns) {
      const response = await isRequestDenied(requestFn());
      expect(response.permissionDenied).toBe(true);
    }
  });

  it(`TG.D.0.D should deny delete access to a ${collectionNames.todoGroups} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.todoGroups, todoGroup1.id);
      await setDoc(docRef, todoGroup1);
    });

    const authedDb = testEnv.authenticatedContext(todoGroup1.uids[0]).firestore();
    const docRef = doc(authedDb, collectionNames.todoGroups, todoGroup1.id);
    const deleteDocResult = await isRequestDenied(deleteDoc(docRef));

    expect(deleteDocResult.permissionDenied).toBe(true);
  });
});
