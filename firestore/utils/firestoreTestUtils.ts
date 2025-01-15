import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  DocumentData,
  DocumentSnapshot,
  QuerySnapshot,
  setLogLevel,
} from "firebase/firestore";
import { readFileSync } from "fs";
import path from "path";

export const setDefaultLogLevel = () => setLogLevel("error");

export const createTestEnvironment = async () => {
  return initializeTestEnvironment({
    projectId: "demo-firestore-data-modelling-tests",
    firestore: {
      rules: readFileSync(
        path.resolve(__dirname, "../firestore.rules"),
        "utf8"
      ),
      host: "127.0.0.1",
      port: 8080,
    },
  });
};

export async function expectPermissionDenied(
  promise: Promise<unknown>,
  options?: { onError?: () => void }
) {
  return new Promise<void>(async (resolve) => {
    const hasFailed = await (async () => {
      try {
        const errorResult = await assertFails(promise);
        return ["permission-denied", "PERMISSION_DENIED"].includes(
          errorResult.code
        );
      } catch (error) {
        return false;
      }
    })();
    if (!hasFailed) {
      if (options?.onError) options.onError();
      else throw new Error("Expected request to fail, but it succeeded.");
    } else expect(hasFailed).toBe(true);
    resolve(undefined);
  });
}

export async function isRequestDenied(promise: Promise<unknown>) {
  try {
    const errorResult = await assertFails(promise);
    const permissionDenied = [
      "permission-denied",
      "PERMISSION_DENIED",
    ].includes(errorResult.code);

    return {
      permissionDenied,
      permissionGranted: !permissionDenied,
      error: permissionDenied ? "PERMISSION_DENIED" : undefined,
    } as const;
  } catch (error) {
    return { permissionDenied: false, permissionGranted: true } as const;
  }
}
export async function isRequestGranted<T extends Promise<unknown>>(promise: T) {
  try {
    const response = (await assertSucceeds(promise)) as
      | QuerySnapshot<DocumentData, DocumentData>
      | DocumentSnapshot
      | unknown;
    const data =
      response instanceof QuerySnapshot
        ? response.docs.map((x) => x.data())
        : response instanceof DocumentSnapshot
        ? response.data()
        : response;
    return {
      permissionGranted: true,
      permissionDenied: false,
      data: data,
    } as const;
  } catch (error) {
    return { permissionDenied: true, permissionGranted: false } as const;
  }
}
