import { Timestamp } from "firebase/firestore";
import { z } from "zod";

export const timestampSchema = z.object({ seconds: z.number(), nanoseconds: z.number() });

export const collectionNames = {
  userTodos: "userTodos",
  memberNotices: "memberNotices",
  todoGroups: "todoGroups",
  groupTodos: "groupTodos",
  publicNotices: "publicNotices",
  siteConfig: "siteConfig",
  todoVersionHistory: "todoVersionHistory",
  todoVersions: "todoVersions",
} as const;

export const publicNoticeSchema = z.object({ id: z.string(), some: z.string() });
export type TPublicNotice = z.infer<typeof publicNoticeSchema>;
export type TPublicNoticeKey = keyof TPublicNotice;
export const publicNotice1 = { id: "id1", some: "data" } as const satisfies TPublicNotice;

export const userTodoSchema = z.object({
  id: z.string(),
  uid: z.string(),
  task: z.string(),
  completed: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type TUserTodo = z.infer<typeof userTodoSchema>;
export type TUserTodoKey = keyof TUserTodo;

export const userTodo1 = {
  id: "id1",
  uid: "uid1",
  task: "uid1",
  completed: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
} as const satisfies TUserTodo;

export const memberNotice1 = { some: "data2" };

export const todoGroupSchema = z.object({
  id: z.string(),
  uids: z.array(z.string()),
  name: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type TTodoGroup = z.infer<typeof todoGroupSchema>;
export type TTodoGroupKey = keyof TTodoGroup;
export const todoGroup1 = {
  id: "id1",
  uids: ["uid1", "uid2"],
  name: "this group",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
} as const satisfies TTodoGroup;

export const groupTodoSchema = z.object({
  id: z.string(),
  todoGroupId: z.string(),
  task: z.string(),
  completed: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type TGroupTodo = z.infer<typeof groupTodoSchema>;
export type TGroupTodoKey = keyof TGroupTodo;

export const groupTodo1 = {
  id: "gt_id1",
  todoGroupId: todoGroup1.id,
  task: "task",
  completed: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
} as const satisfies TGroupTodo;

export const siteConfigSchema = z.object({
  id: z.literal("unique"),
  adminUids: z.array(z.string()),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
export type TSiteConfig = z.infer<typeof siteConfigSchema>;
export type TSiteConfigKey = keyof TSiteConfig;
export const siteConfig1 = {
  id: "unique",
  adminUids: ["uid1", "uid2"],
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
} as const satisfies TSiteConfig;
