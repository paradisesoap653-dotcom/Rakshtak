import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";

// ===== جدول المستخدمين (السائقين والركاب) =====
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("rider"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== جدول الرحلات (معدّل) =====
export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  serviceType: varchar("service_type", { length: 20 }).notNull(),
  pickupLocation: text("pickup_location").notNull(),
  destination: text("destination").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("searching"),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerName: varchar("customer_name", { length: 50 }),
  driverId: varchar("driver_id", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});
