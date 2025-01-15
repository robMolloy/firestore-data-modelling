import { serverTimestamp, Timestamp } from "firebase/firestore";

//
export const removeKey = <T extends object, K extends keyof T>(key: K, object: T): Omit<T, K> => {
  const { [key]: _, ...rest } = object;
  return rest;
};

export type TServerTimestamp = ReturnType<typeof serverTimestamp>;
export type TTimestamp = ReturnType<typeof Timestamp.now>;

export const creatifyDoc = <T extends object>(obj: T) => {
  return { ...obj, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
};

export const updatifyDoc = <T extends object>(object: T) => {
  return { ...object, updatedAt: serverTimestamp() };
};

export const getNotNowTimestamp = () => {
  const now = Timestamp.now();
  return { ...now, nanoseconds: now.nanoseconds - 1 };
};
