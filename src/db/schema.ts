import { pgTable, serial, varchar, text, timestamp, integer, doublePrecision, json } from "drizzle-orm/pg-core";

// ===== جدول المستخدمين =====
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
  
  // ===== ميزة التتبع (النقطة 2) =====
  driverLat: doublePrecision("driver_lat"),
  driverLng: doublePrecision("driver_lng"),

  // ===== ميزة التقييم (النقطة 3) =====
  driverRating: integer("driver_rating"), // تقييم السائق من الراكب
  riderRating: integer("rider_rating"),   // تقييم الراكب من السائق (اختياري)
  ratingComment: text("rating_comment"),

  createdAt: timestamp("created_at").defaultNow(),
});

// ===== جدول التقييمات (لتاريخ التقييمات) =====
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").references(() => rides.id),
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
