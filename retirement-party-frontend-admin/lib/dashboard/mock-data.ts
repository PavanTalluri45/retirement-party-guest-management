import type { RsvpRecord } from "./types";

// ==================================================
// MOCK DATA
// (Replace with real API data — this file has no
// network calls, sockets, or backend dependencies.)
// ==================================================

type RawRsvp = Omit<RsvpRecord, "id" | "attendedAt">;

const RAW_MOCK: RawRsvp[] = [
  { name: "Aarav Sharma", isAttending: "Yes", attended: true, foodPreference: "veg", phoneNumber: "+91 98765 43210", confirmationNumber: "4821", familyCount: 3, familyMembers: ["Kiran Sharma", "Diya Sharma"], createdAtRaw: "2026-08-12T09:30:00" },
  { name: "Priya Nair", isAttending: "Yes", attended: true, foodPreference: "nonveg", phoneNumber: "+91 91234 56780", confirmationNumber: "3390", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-12T10:05:00" },
  { name: "Rohan Mehta", isAttending: "No", attended: false, foodPreference: "veg", phoneNumber: "+91 99887 66554", confirmationNumber: "1207", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-13T08:15:00" },
  { name: "Ananya Iyer", isAttending: "Yes", attended: false, foodPreference: "veg", phoneNumber: "+91 90909 12345", confirmationNumber: "5643", familyCount: 2, familyMembers: ["Suresh Iyer"], createdAtRaw: "2026-08-13T11:40:00" },
  { name: "Vikram Rao", isAttending: "Yes", attended: true, foodPreference: "nonveg", phoneNumber: "+91 98450 11223", confirmationNumber: "2098", familyCount: 4, familyMembers: ["Lakshmi Rao", "Aditi Rao", "Arjun Rao"], createdAtRaw: "2026-08-13T14:20:00" },
  { name: "Sneha Kapoor", isAttending: "Yes", attended: false, foodPreference: "veg", phoneNumber: "+91 97123 88990", confirmationNumber: "7712", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-14T09:00:00" },
  { name: "Aditya Verma", isAttending: "No", attended: false, foodPreference: "nonveg", phoneNumber: "+91 96543 21098", confirmationNumber: "0456", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-14T16:45:00" },
  { name: "Kavya Reddy", isAttending: "Yes", attended: true, foodPreference: "veg", phoneNumber: "+91 95012 34567", confirmationNumber: "8834", familyCount: 2, familyMembers: ["Ramesh Reddy"], createdAtRaw: "2026-08-15T10:10:00" },
  { name: "Arjun Singh", isAttending: "Yes", attended: false, foodPreference: "nonveg", phoneNumber: "+91 94001 77665", confirmationNumber: "6120", familyCount: 3, familyMembers: ["Harpreet Singh", "Simran Singh"], createdAtRaw: "2026-08-15T13:25:00" },
  { name: "Meera Pillai", isAttending: "Yes", attended: true, foodPreference: "veg", phoneNumber: "+91 93456 12309", confirmationNumber: "3357", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-16T08:50:00" },
  { name: "Rajesh Kumar", isAttending: "Yes", attended: false, foodPreference: "nonveg", phoneNumber: "+91 92345 67810", confirmationNumber: "9081", familyCount: 2, familyMembers: ["Sunita Kumar"], createdAtRaw: "2026-08-16T15:00:00" },
  { name: "Divya Menon", isAttending: "No", attended: false, foodPreference: "veg", phoneNumber: "+91 91678 90123", confirmationNumber: "1543", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-16T18:30:00" },
  { name: "Karthik Subramaniam", isAttending: "Yes", attended: true, foodPreference: "veg", phoneNumber: "+91 90234 56712", confirmationNumber: "4467", familyCount: 4, familyMembers: ["Priya Subramaniam", "Ravi Subramaniam", "Anu Subramaniam"], createdAtRaw: "2026-08-17T09:15:00" },
  { name: "Neha Joshi", isAttending: "Yes", attended: false, foodPreference: "nonveg", phoneNumber: "+91 89012 34590", confirmationNumber: "2295", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-17T12:05:00" },
  { name: "Siddharth Malhotra", isAttending: "Yes", attended: true, foodPreference: "veg", phoneNumber: "+91 88123 45067", confirmationNumber: "6689", familyCount: 2, familyMembers: ["Pooja Malhotra"], createdAtRaw: "2026-08-17T17:40:00" },
  { name: "Pooja Desai", isAttending: "No", attended: false, foodPreference: "nonveg", phoneNumber: "+91 87234 56178", confirmationNumber: "0912", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-18T10:00:00" },
  { name: "Manoj Pillai", isAttending: "Yes", attended: false, foodPreference: "veg", phoneNumber: "+91 86345 67289", confirmationNumber: "5501", familyCount: 3, familyMembers: ["Latha Pillai", "Anand Pillai"], createdAtRaw: "2026-08-18T14:20:00" },
  { name: "Ritu Chawla", isAttending: "Yes", attended: true, foodPreference: "nonveg", phoneNumber: "+91 85456 78390", confirmationNumber: "3378", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-19T09:50:00" },
  { name: "Suresh Iyer Jr", isAttending: "Yes", attended: false, foodPreference: "veg", phoneNumber: "+91 84567 89401", confirmationNumber: "7645", familyCount: 2, familyMembers: ["Radha Iyer"], createdAtRaw: "2026-08-19T13:10:00" },
  { name: "Anjali Bhatt", isAttending: "Yes", attended: true, foodPreference: "veg", phoneNumber: "+91 83678 90512", confirmationNumber: "9930", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-19T16:35:00" },
  { name: "Nikhil Rana", isAttending: "No", attended: false, foodPreference: "nonveg", phoneNumber: "+91 82789 01623", confirmationNumber: "1178", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-20T08:20:00" },
  { name: "Shreya Gupta", isAttending: "Yes", attended: false, foodPreference: "nonveg", phoneNumber: "+91 81890 12734", confirmationNumber: "4413", familyCount: 2, familyMembers: ["Amit Gupta"], createdAtRaw: "2026-08-20T11:45:00" },
  { name: "Varun Chatterjee", isAttending: "Yes", attended: true, foodPreference: "veg", phoneNumber: "+91 80901 23845", confirmationNumber: "8867", familyCount: 3, familyMembers: ["Rina Chatterjee", "Debu Chatterjee"], createdAtRaw: "2026-08-20T15:15:00" },
  { name: "Isha Bansal", isAttending: "Yes", attended: false, foodPreference: "veg", phoneNumber: "+91 79012 34956", confirmationNumber: "2256", familyCount: 1, familyMembers: [], createdAtRaw: "2026-08-21T09:05:00" },
];

export const MOCK_RSVPS: RsvpRecord[] = RAW_MOCK.map((item, index) => ({
  id: `mock-${index + 1}`,
  ...item,
  attendedAt: item.attended
    ? new Date(
        new Date(item.createdAtRaw).getTime() + 6 * 24 * 60 * 60 * 1000,
      ).toISOString()
    : null,
}));

export const ITEMS_PER_PAGE = 10;
