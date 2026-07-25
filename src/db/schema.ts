import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  serviceType: varchar("service_type", { length: 20 }).notNull(),
  pickupLocation: text("pickup_location").notNull(),
  destination: text("destination").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("searching"),
  customerPhone: varchar("customer_phone", { length: 20 }),
  driverId: varchar("driver_id", { length: 20 }),
  driverPhone: varchar("driver_phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});
