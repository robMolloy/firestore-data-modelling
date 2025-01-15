import { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, query, collection, getDocs } from "firebase/firestore";
import * as fsUtils from "./utils/firestoreTestUtils";
import { collectionNames, publicNotice1 } from "./firestoreTestMocks";

let testEnv: RulesTestEnvironment;

describe("firestore rules for a randomCollection", () => {
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

  it(`PN.G.0.A should grant get access to a ${collectionNames.publicNotices} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.publicNotices, publicNotice1.id);
      await setDoc(docRef, publicNotice1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.publicNotices, publicNotice1.id);
    const response = await fsUtils.isRequestGranted(getDoc(docRef));
    expect(response.permissionGranted).toBe(true);
    expect(response.data).toEqual(publicNotice1);
  });

  it(`PN.L.0.A should grant list access to a ${collectionNames.publicNotices} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.publicNotices, publicNotice1.id);
      await setDoc(docRef, publicNotice1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const q = query(collection(unauthedDb, collectionNames.publicNotices));
    const response = await fsUtils.isRequestGranted(getDocs(q));
    expect(response.permissionGranted).toBe(true);
    expect(response.data).toEqual([publicNotice1]);
  });

  it(`PN.C.0.D should deny create access to a ${collectionNames.publicNotices} collection`, async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.publicNotices, publicNotice1.id);

    const setDocResult = await fsUtils.isRequestDenied(setDoc(docRef, publicNotice1));
    expect(setDocResult.permissionDenied).toBe(true);
  });

  it(`PN.U.0.D should deny update access to a ${collectionNames.publicNotices} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.publicNotices, publicNotice1.id);
      await setDoc(docRef, publicNotice1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.publicNotices, publicNotice1.id);

    const promises = [
      fsUtils.isRequestGranted(setDoc(docRef, { some: "data2" })),
      fsUtils.isRequestGranted(setDoc(docRef, { more: "data" }, { merge: true })),
    ];
    const results = await Promise.all(promises);
    const isAllDenied = results.every((x) => x.permissionDenied);
    expect(isAllDenied).toBe(true);
  });

  it(`PN.D.0.D should deny delete access to a ${collectionNames.publicNotices} collection`, async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), collectionNames.publicNotices, publicNotice1.id);
      await setDoc(docRef, publicNotice1);
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, collectionNames.publicNotices, publicNotice1.id);
    const deleteDocResult = await fsUtils.isRequestDenied(deleteDoc(docRef));

    expect(deleteDocResult.permissionDenied).toBe(true);
  });
});
