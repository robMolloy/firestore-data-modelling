import { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import * as fsUtils from "./utils/firestoreTestUtils";

let testEnv: RulesTestEnvironment;

const randomCollectionName = "randomCollection";

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

  it("should not allow read access to a random collection", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), randomCollectionName, "id1");
      await setDoc(docRef, { some: "data" });
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, randomCollectionName, "id1");

    const promises = [
      fsUtils.isRequestGranted(getDoc(docRef)),
      fsUtils.isRequestDenied(getDoc(docRef)),
    ];
    const results = await Promise.all(promises);
    const isAllDenied = results.every((x) => x.permissionDenied);
    if (isAllDenied) return;

    throw new Error(
      `permission granted from to getDoc from ${randomCollectionName} but should not be`
    );
  });

  it("should not allow create access to a random collection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, randomCollectionName, "id1");
    const promises = [
      fsUtils.isRequestGranted(setDoc(docRef, { some: "data2" })),
      fsUtils.isRequestDenied(setDoc(docRef, { some: "data2" })),
    ];
    const results = await Promise.all(promises);
    const isAllDenied = results.every((x) => x.permissionDenied);
    if (isAllDenied) return;

    throw new Error(
      `permission granted to setDoc on ${randomCollectionName} but should not be`
    );
  });

  it("should not allow update access to a random collection", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), randomCollectionName, "id1");
      await setDoc(docRef, { some: "data" });
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, randomCollectionName, "id1");

    const promises = [
      fsUtils.isRequestGranted(setDoc(docRef, { some: "data2" })),
      fsUtils.isRequestGranted(
        setDoc(docRef, { more: "data" }, { merge: true })
      ),
      fsUtils.isRequestDenied(setDoc(docRef, { some: "data2" })),
      fsUtils.isRequestDenied(
        setDoc(docRef, { more: "data" }, { merge: true })
      ),
    ];
    const results = await Promise.all(promises);
    const isAllDenied = results.every((x) => x.permissionDenied);
    if (isAllDenied) return;

    throw new Error(
      `permission granted to setDoc updates on ${randomCollectionName} but should not be`
    );
  });

  it("should not allow delete access to a random collection", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), randomCollectionName, "id1");
      await setDoc(docRef, { some: "data" });
    });

    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(unauthedDb, randomCollectionName, "id1");
    const promises = [
      fsUtils.isRequestDenied(deleteDoc(docRef)),
      fsUtils.isRequestGranted(deleteDoc(docRef)),
    ];

    const results = await Promise.all(promises);
    const isAllDenied = results.every((x) => x.permissionDenied);
    if (isAllDenied) return;

    throw new Error(
      `permission granted to deleteDoc on ${randomCollectionName} but should not be`
    );
  });
});
