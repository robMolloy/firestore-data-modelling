import { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { collectionNames, TUserTodo, TUserTodoKey, userTodo1 } from "./firestoreTestMocks";
import {
  createTestEnvironment,
  isRequestDenied,
  isRequestGranted,
  setDefaultLogLevel,
} from "./utils/firestoreTestUtils";
import { creatifyDoc, getNotNowTimestamp, removeKey, updatifyDoc } from "./utils/firestoreUtils";

let testEnv: RulesTestEnvironment;

describe(`firestore rules for ${collectionNames.userTodos} collection`, () => {
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

  it(`UT.G.0.A should allow get access if auth.uid == existing.uid from ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);
    const response = await isRequestGranted(getDoc(docRef));
    expect(response.permissionGranted).toBe(true);
    expect(response.data).toEqual(userTodo1);
  });

  it(`UT.G.1.D.unauth should deny get access if unauthenticated user requests from ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.userTodos, userTodo1.id);
    const response = await isRequestGranted(getDoc(docRef));
    expect(response.permissionDenied).toBe(true);
  });

  it(`UT.G.1.D.wrongUser should deny get access if auth.uid != existing.uid from ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(`not_${userTodo1.uid}`).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);
    const response = await isRequestGranted(getDoc(docRef));
    expect(response.permissionDenied).toBe(true);
  });

  it(`UT.L.0.A should allow list access if auth.uid == existing.uid from ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const q = query(
      collection(authedDb, collectionNames.userTodos),
      where("uid", "==", userTodo1.uid),
    );

    const response = await isRequestGranted(getDocs(q));
    expect(response.permissionGranted).toBe(true);
    expect(response.data).toEqual([userTodo1]);
  });

  it(`UT.L.1.D.unauth should deny list access if unauthenticated user requests from ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const q = query(
      collection(unauthedDb, collectionNames.userTodos),
      where("uid", "==", `not_${userTodo1.uid}`),
    );

    const response = await isRequestDenied(getDocs(q));
    expect(response.permissionDenied).toBe(true);
  });

  it(`UT.L.1.D.wrongUser should deny list access if auth.uid != existing.uid from ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const q = query(
      collection(authedDb, collectionNames.userTodos),
      where("uid", "==", `not_${userTodo1.uid}`),
    );

    const response = await isRequestDenied(getDocs(q));
    expect(response.permissionDenied).toBe(true);
  });

  it(`UT.C.0.A should allow create access if user is authenticated and data is valid to ${collectionNames.userTodos}`, async () => {
    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const createDocResult = await isRequestGranted(setDoc(docRef, creatifyDoc(userTodo1)));

    expect(createDocResult.permissionGranted).toBe(true);
  });

  it(`UT.C.1.D should deny create access if missing key to ${collectionNames.userTodos}`, async () => {
    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const createUserTodoKeys = Object.keys(creatifyDoc(userTodo1)) as TUserTodoKey[];
    const missingKeyUserTodos = createUserTodoKeys.map((key) =>
      removeKey(key, creatifyDoc(userTodo1)),
    );
    const promises = missingKeyUserTodos.map((todo) => {
      return isRequestDenied(setDoc(docRef, todo));
    });
    const results = await Promise.all(promises);
    const isAllDenied = results.every((x) => x.permissionDenied);
    expect(isAllDenied).toBe(true);
  });

  it(`UT.C.2.D should deny create access if additional key to ${collectionNames.userTodos}`, async () => {
    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const additionalKeyUserTodo = { ...creatifyDoc(userTodo1), another: "key" };
    const result = await isRequestDenied(setDoc(docRef, additionalKeyUserTodo));

    expect(result.permissionDenied).toBe(true);
  });

  it(`UT.C.3.D should deny access if getIncomingId() != incoming.id to ${collectionNames.userTodos}`, async () => {
    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const mismatchIdDoc = { ...creatifyDoc(userTodo1), id: `not_${userTodo1.id}` };
    const result = await isRequestDenied(setDoc(docRef, mismatchIdDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`UT.C.4.D should deny access if isNotNow(incoming.createdAt) to ${collectionNames.userTodos}`, async () => {
    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const notNowCreatedAtDoc = { ...creatifyDoc(userTodo1), createdAt: getNotNowTimestamp() };
    const result = await isRequestDenied(setDoc(docRef, notNowCreatedAtDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`UT.C.5.D should deny access if isNotNow(incoming.updatedAt) to ${collectionNames.userTodos}`, async () => {
    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const notNowUpdatedAtDoc = { ...creatifyDoc(userTodo1), updatedAt: getNotNowTimestamp() };
    const result = await isRequestDenied(setDoc(docRef, notNowUpdatedAtDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`UT.C.6.D.wrongUser should deny create access if auth.uid != incoming.uid to ${collectionNames.userTodos}`, async () => {
    const authedDb = testEnv.authenticatedContext(`not_${userTodo1.uid}`).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const createDocResult = await isRequestDenied(setDoc(docRef, creatifyDoc(userTodo1)));

    expect(createDocResult.permissionDenied).toBe(true);
  });

  it(`UT.C.6.D.unauth should deny create access if user is unauthenticated to ${collectionNames.userTodos}`, async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.userTodos, userTodo1.id);

    const createDocResult = await isRequestDenied(setDoc(docRef, creatifyDoc(userTodo1)));

    expect(createDocResult.permissionDenied).toBe(true);
  });

  it(`UT.U.0.A should allow update access if user is authenticated and owns the doc to ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const updateDocResult = await isRequestGranted(
      setDoc(docRef, updatifyDoc({ ...userTodo1, task: "new" } as TUserTodo)),
    );
    expect(updateDocResult.permissionGranted).toBe(true);
    const updateDocResult2 = await isRequestGranted(
      setDoc(docRef, updatifyDoc({ ...userTodo1, completed: true } as TUserTodo)),
    );
    expect(updateDocResult2.permissionGranted).toBe(true);
  });

  it(`UT.U.1.D should deny update access if wrong keys are changed ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const updateDocResult = await isRequestGranted(
      setDoc(docRef, updatifyDoc({ ...userTodo1, task: "new" } as TUserTodo)),
    );

    expect(updateDocResult.permissionGranted).toBe(true);
  });

  it(`UT.U.2.D should deny update access if missing key to ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const createUserTodoKeys = Object.keys(creatifyDoc(userTodo1)) as TUserTodoKey[];
    const missingKeyUserTodos = createUserTodoKeys.map((key) =>
      removeKey(key, updatifyDoc(userTodo1)),
    );
    for (const todo of missingKeyUserTodos) {
      const updateDocResult = await isRequestDenied(setDoc(docRef, todo));
      expect(updateDocResult.permissionDenied).toBe(true);
    }
  });

  it(`UT.U.3.D should deny update access if missing key to ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const additionalKeyUserTodo = { ...creatifyDoc(userTodo1), another: "key" };
    const result = await isRequestDenied(setDoc(docRef, additionalKeyUserTodo));

    expect(result.permissionDenied).toBe(true);
  });

  it(`UT.U.4.D should deny update if isNotNow(incoming.updatedAt) to ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });
    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const notNowUpdatedAtDoc = { ...userTodo1, updatedAt: getNotNowTimestamp() };
    const result = await isRequestDenied(setDoc(docRef, notNowUpdatedAtDoc));

    expect(result.permissionDenied).toBe(true);
  });

  it(`UT.U.5.D.wrongUser should deny update access if auth.uid != incoming.uid to ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });
    const authedDb = testEnv.authenticatedContext(`not_${userTodo1.uid}`).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);

    const updateDocResult = await isRequestDenied(setDoc(docRef, updatifyDoc(userTodo1)));

    expect(updateDocResult.permissionDenied).toBe(true);
  });

  it(`UT.U.5.D.unauth should deny update access if auth.uid == null to ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.userTodos, userTodo1.id);

    const updateDocResult = await isRequestDenied(setDoc(docRef, updatifyDoc(userTodo1)));

    expect(updateDocResult.permissionDenied).toBe(true);
  });

  it(`UT.D.0.A should allow delete if auth.uid == existing.uid from ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(userTodo1.uid).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);
    const response = await isRequestGranted(deleteDoc(docRef));
    expect(response.permissionGranted).toBe(true);
  });

  it(`UT.D.1.D.unauth should deny delete if unauthenticated user requests from ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.userTodos, userTodo1.id);
    const response = await isRequestGranted(deleteDoc(docRef));
    expect(response.permissionDenied).toBe(true);
  });

  it(`UT.D.1.D.wrongUser should deny delete if auth.uid != existing.uid from ${collectionNames.userTodos}`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.userTodos, userTodo1.id);
      await setDoc(docRef, userTodo1);
    });

    const authedDb = testEnv.authenticatedContext(`not_${userTodo1.uid}`).firestore();
    const docRef = doc(authedDb, collectionNames.userTodos, userTodo1.id);
    const response = await isRequestGranted(deleteDoc(docRef));
    expect(response.permissionDenied).toBe(true);
  });
});
