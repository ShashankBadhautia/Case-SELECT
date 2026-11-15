/**
 * Case C001, "The Murderer Is Not a Suspect" ("Case Select 000" in the design doc).
 *
 * Source: the "Case Select" design doc. Everything here is content, not code:
 * seed.js loads it as-is. To add a case, write another file shaped like this
 * one and register it in seed.js.
 *
 * Additions beyond the doc, so the case plays end to end:
 *   - NPCs N001–N005 are named after people already in the dataset.
 *   - Dialogues D005–D008 were written but never placed; they now have steps,
 *     which also gives the Main Dining Hall (L002) a reason to be visited.
 *   - The detective arrives at the Parking Area (L005), the case start location.
 *   - Waiter names follow the kitchen logs (W003 collected the risotto = Rohan).
 *   - Each query has answerValues/maxRows so the backend can grade it.
 */

export const caseRecord = {
  id: "C001",
  caseName: "The Murderer Is Not a Suspect",
  description:
    "A politician is murdered during a private dinner at The Red Lantern Diner. Six guests appear suspicious, but the evidence suggests the real mastermind was never considered a suspect.",
  difficulty: "Medium",
  startLocationId: "L005",
};

export const locations = [
  { id: "L001", locationName: "The Red Lantern Diner", description: "An upscale private diner where Vikram Malhotra hosted the dinner." },
  { id: "L002", locationName: "Main Dining Hall", description: "The private dining area where the guests had dinner." },
  { id: "L003", locationName: "Main Kitchen", description: "Restricted area where meals were prepared and plated." },
  { id: "L004", locationName: "Staff Office", description: "Small office containing employee records and financial documents." },
  { id: "L005", locationName: "Parking Area", description: "Private parking area outside the diner." },
  { id: "L006", locationName: "Vikram's Office", description: "Vikram Malhotra's office, where additional information about his business dealings can be found." },
];

export const npcs = [
  { id: "N001", npcName: "Rahul Sen", role: "Diner Manager" },
  { id: "N002", npcName: "Rohan Mehra", role: "Waiter" },
  { id: "N003", npcName: "Priya Menon", role: "Diner Guest" },
  { id: "N004", npcName: "Neha Kapoor", role: "Political Rival" },
  { id: "N005", npcName: "Sana Mirza", role: "Personal Assistant" },
];

export const dialogues = [
  { id: "D001", npcId: "N001", locationId: "L001", dialoguesList: ["Detective, I'm glad you're here. This was supposed to be a private dinner."] },
  { id: "D002", npcId: "N001", locationId: "L001", dialoguesList: ["Vikram Malhotra was sitting at the center of the table when he suddenly collapsed."] },
  { id: "D003", npcId: "N001", locationId: "L001", dialoguesList: ["There were six people at the dinner who had reasons to dislike him."] },
  { id: "D004", npcId: "N002", locationId: "L001", dialoguesList: ["I was nowhere near the kitchen that evening."] },
  { id: "D005", npcId: "N002", locationId: "L001", dialoguesList: ["I only delivered the dishes. I didn't see anything unusual."] },
  { id: "D006", npcId: "N003", locationId: "L002", dialoguesList: ["Vikram seemed nervous during dinner. He kept checking his phone."] },
  { id: "D007", npcId: "N004", locationId: "L002", dialoguesList: ["Everyone keeps looking at us, but none of us killed him."] },
  { id: "D008", npcId: "N002", locationId: "L001", dialoguesList: ["I told you, I never entered the kitchen."] },
  { id: "D009", npcId: "N005", locationId: "L006", dialoguesList: ["Arvind? He and Vikram had been business partners for years."] },
  { id: "D010", npcId: "N005", locationId: "L006", dialoguesList: ["They had been arguing about money recently."] },
  { id: "D011", npcId: "N002", locationId: "L001", dialoguesList: ["Fine... I entered the kitchen. But I didn't kill Vikram."] },
  { id: "D012", npcId: "N002", locationId: "L001", dialoguesList: ["Someone offered me money to do something. I didn't know they planned to kill him."] },
];

export const evidences = [
  { id: "EV001", evidenceName: "Mushroom Risotto Order", description: "Vikram Malhotra ordered Mushroom Risotto shortly before his death." },
  { id: "EV002", evidenceName: "Rohan Served the Dish", description: "Rohan Mehra was responsible for delivering Vikram's Mushroom Risotto." },
  { id: "EV003", evidenceName: "Kitchen Entry", description: "Kitchen logs prove Rohan entered the kitchen." },
  { id: "EV004", evidenceName: "Access Card Confirmation", description: "Rohan's access card confirms his kitchen entry." },
  { id: "EV005", evidenceName: "₹50,000 Payment", description: "Rohan received ₹50,000 shortly before the murder." },
  { id: "EV006", evidenceName: "Account B009", description: "The payment originated from bank account B009." },
  { id: "EV007", evidenceName: "Arvind's Account", description: "Bank account B009 belongs to Arvind Khanna." },
  { id: "EV008", evidenceName: "The Mastermind", description: "The evidence establishes Arvind Khanna as the person who planned the murder." },
];

/** `evidenceId` is the evidence the query uncovers ("discovered_by_query" in the doc). */
export const queries = [
  {
    id: "Q001", evidenceId: "EV001", difficulty: "Easy",
    title: "The Victim's Last Meal",
    question: "What dish did Vikram Malhotra order?",
    hint: "Search the restaurant orders for the victim.",
    queryOutput: "Mushroom Risotto",
    unlockMessage: "You discover what the victim ordered.",
    answerValues: ["Mushroom Risotto"], maxRows: 1,
  },
  {
    id: "Q002", evidenceId: "EV002", difficulty: "Easy",
    title: "Who Served the Dish?",
    question: "Which waiter delivered Vikram's Mushroom Risotto?",
    hint: "Find the order containing Mushroom Risotto.",
    queryOutput: "Rohan Mehra",
    unlockMessage: "You now know which waiter handled the dish.",
    answerValues: ["Rohan Mehra"], maxRows: 1,
  },
  {
    id: "Q003", evidenceId: "EV003", difficulty: "Easy",
    title: "The Kitchen Lie",
    question: "Did Rohan Mehra enter the kitchen that evening?",
    hint: "Search the kitchen logs using Rohan's employee ID.",
    queryOutput: "Yes",
    unlockMessage: "Rohan's statement doesn't match the kitchen logs.",
    answerValues: ["Entered Kitchen", "19:44"], maxRows: 3,
  },
  {
    id: "Q004", evidenceId: "EV004", difficulty: "Medium",
    title: "The Second Record",
    question: "Can the access-card records confirm Rohan's kitchen entry?",
    hint: "Compare Rohan's kitchen access with the kitchen logs.",
    queryOutput: "Yes",
    unlockMessage: "The access-card system confirms the contradiction.",
    answerValues: ["Kitchen", "Entry", "19:44"], maxRows: 4,
  },
  {
    id: "Q005", evidenceId: "EV005", difficulty: "Medium",
    title: "Follow the Money",
    question: "Was Rohan Mehra paid before the murder?",
    hint: "Look for payments sent to Rohan's bank account.",
    queryOutput: "₹50,000",
    unlockMessage: "Someone paid Rohan ₹50,000.",
    answerValues: ["50000"], maxRows: 1,
  },
  {
    id: "Q006", evidenceId: "EV006", difficulty: "Medium",
    title: "The Anonymous Account",
    question: "Which bank account sent the ₹50,000 payment?",
    hint: "Start with the payment received by Rohan.",
    queryOutput: "B009",
    unlockMessage: "The money came from account B009.",
    answerValues: ["B009"], maxRows: 1,
  },
  {
    id: "Q007", evidenceId: "EV007", difficulty: "Medium",
    title: "Who Owns the Account?",
    question: "Who owns bank account B009?",
    hint: "Connect the bank account to its owner.",
    queryOutput: "Arvind Khanna",
    unlockMessage: "The account belongs to Arvind Khanna.",
    answerValues: ["Arvind Khanna"], maxRows: 1,
  },
  {
    id: "Q008", evidenceId: "EV008", difficulty: "Hard",
    title: "The Mastermind",
    question: "Who planned Vikram Malhotra's murder?",
    hint: "Follow the evidence from the victim → waiter → payment → account owner.",
    queryOutput: "Arvind Khanna",
    unlockMessage: "The evidence points to Arvind as the mastermind.",
    answerValues: ["Arvind Khanna"], maxRows: 1,
  },
];

export const investigationTables = [
  { id: "IT001", tableName: "guests", displayName: "Guests", description: "People who attended the private dinner." },
  { id: "IT002", tableName: "restaurant_orders", displayName: "Restaurant Orders", description: "Food and drink orders placed during the dinner." },
  { id: "IT003", tableName: "waiters", displayName: "Waiters", description: "Restaurant waiters who served the dinner." },
  { id: "IT004", tableName: "employees", displayName: "Employees", description: "Employees working at The Red Lantern Diner." },
  { id: "IT005", tableName: "kitchen_logs", displayName: "Kitchen Logs", description: "Records of employee activity inside the kitchen." },
  { id: "IT006", tableName: "access_cards", displayName: "Access Cards", description: "Electronic access records for restricted areas." },
  { id: "IT007", tableName: "payments", displayName: "Payments", description: "Financial transactions between bank accounts." },
  { id: "IT008", tableName: "bank_accounts", displayName: "Bank Accounts", description: "Bank accounts associated with guests and employees." },
  { id: "IT009", tableName: "phone_records", displayName: "Phone Records", description: "Phone activity associated with people connected to the investigation." },
];

/**
 * The case flow, in order. Each step is a dialogue (talk to an NPC) or a query
 * (solve it at that location's terminal). The doc's 16 steps are kept in their
 * order; the [added] steps place the dialogues the doc wrote but never used.
 */
export const steps = [
  { dialogueId: "D001", locationId: "L001" },
  { dialogueId: "D002", locationId: "L001" },
  { dialogueId: "D003", locationId: "L001" },
  { dialogueId: "D006", locationId: "L002" }, // [added]
  { dialogueId: "D007", locationId: "L002" }, // [added]
  { queryId: "Q001", locationId: "L001" },
  { queryId: "Q002", locationId: "L001" },
  { dialogueId: "D004", locationId: "L001" },
  { dialogueId: "D005", locationId: "L001" }, // [added]
  { queryId: "Q003", locationId: "L003" },
  { queryId: "Q004", locationId: "L003" },
  { dialogueId: "D008", locationId: "L001" }, // [added]
  { dialogueId: "D011", locationId: "L001" },
  { queryId: "Q005", locationId: "L004" },
  { queryId: "Q006", locationId: "L004" },
  { queryId: "Q007", locationId: "L006" },
  { dialogueId: "D009", locationId: "L006" },
  { dialogueId: "D010", locationId: "L006" },
  { queryId: "Q008", locationId: "L006" },
  { dialogueId: "D012", locationId: "L001" },
];

// ───────────── Investigation data (the tables players query) ─────────────

export const guests = [
  { id: "G001", guestName: "Vikram Malhotra", role: "Victim / Politician", isSuspect: false },
  { id: "G002", guestName: "Neha Kapoor", role: "Political Rival", isSuspect: true },
  { id: "G003", guestName: "Karan Bedi", role: "Political Aide", isSuspect: true },
  { id: "G004", guestName: "Meera Sethi", role: "Investigative Journalist", isSuspect: true },
  { id: "G005", guestName: "Rajiv Oberoi", role: "Business Contractor", isSuspect: true },
  { id: "G006", guestName: "Sana Mirza", role: "Personal Assistant", isSuspect: true },
  { id: "G007", guestName: "Dev Ahuja", role: "Opposition Leader", isSuspect: true },
  { id: "G008", guestName: "Arvind Khanna", role: "Business Partner", isSuspect: false },
  { id: "G009", guestName: "Priya Menon", role: "Diner Guest", isSuspect: false },
  { id: "G010", guestName: "Sameer Rao", role: "Party Treasurer", isSuspect: false },
];

export const waiters = [
  { id: "W001", waiterName: "Aman Verma" },
  { id: "W002", waiterName: "Kabir Shah" },
  { id: "W003", waiterName: "Rohan Mehra" },
  { id: "W004", waiterName: "Ishita Rao" },
];

export const restaurantOrders = [
  { id: "O001", guestId: "G001", dish: "Mushroom Risotto", orderTime: "19:42", waiterId: "W003" },
  { id: "O002", guestId: "G002", dish: "Grilled Salmon", orderTime: "19:40", waiterId: "W001" },
  { id: "O003", guestId: "G003", dish: "Chicken Alfredo", orderTime: "19:41", waiterId: "W002" },
  { id: "O004", guestId: "G004", dish: "Caesar Salad", orderTime: "19:39", waiterId: "W001" },
  { id: "O005", guestId: "G005", dish: "Beef Steak", orderTime: "19:43", waiterId: "W002" },
  { id: "O006", guestId: "G006", dish: "Tomato Pasta", orderTime: "19:40", waiterId: "W004" },
  { id: "O007", guestId: "G007", dish: "Lamb Chops", orderTime: "19:42", waiterId: "W001" },
  { id: "O008", guestId: "G008", dish: "Mushroom Risotto", orderTime: "19:44", waiterId: "W003" },
  { id: "O009", guestId: "G009", dish: "Margherita Pizza", orderTime: "19:38", waiterId: "W004" },
  { id: "O010", guestId: "G010", dish: "Grilled Vegetables", orderTime: "19:41", waiterId: "W002" },
];

export const employees = [
  { id: "E001", employeeName: "Aman Verma", jobTitle: "Waiter" },
  { id: "E002", employeeName: "Kabir Shah", jobTitle: "Waiter" },
  { id: "E003", employeeName: "Rohan Mehra", jobTitle: "Waiter" },
  { id: "E004", employeeName: "Ishita Rao", jobTitle: "Waiter" },
  { id: "E005", employeeName: "Vikram Das", jobTitle: "Head Chef" },
  { id: "E006", employeeName: "Nitin Arora", jobTitle: "Sous Chef" },
  { id: "E007", employeeName: "Pooja Nair", jobTitle: "Cashier" },
  { id: "E008", employeeName: "Rahul Sen", jobTitle: "Manager" },
  { id: "E009", employeeName: "Arjun Malhotra", jobTitle: "Security Officer" },
  { id: "E010", employeeName: "Kavita Rao", jobTitle: "Accountant" },
];

export const kitchenLogs = [
  { id: "K001", employeeId: "E001", action: "Entered Kitchen", timestamp: "19:25", kitchenArea: "Main Kitchen" },
  { id: "K002", employeeId: "E002", action: "Entered Kitchen", timestamp: "19:31", kitchenArea: "Main Kitchen" },
  { id: "K003", employeeId: "E003", action: "Entered Kitchen", timestamp: "19:44", kitchenArea: "Main Kitchen" },
  { id: "K004", employeeId: "E004", action: "Entered Kitchen", timestamp: "19:36", kitchenArea: "Main Kitchen" },
  { id: "K005", employeeId: "E003", action: "Collected Mushroom Risotto", timestamp: "19:45", kitchenArea: "Plating Area" },
  { id: "K006", employeeId: "E002", action: "Collected Chicken Alfredo", timestamp: "19:46", kitchenArea: "Plating Area" },
  { id: "K007", employeeId: "E001", action: "Collected Grilled Salmon", timestamp: "19:44", kitchenArea: "Plating Area" },
  { id: "K008", employeeId: "E004", action: "Collected Tomato Pasta", timestamp: "19:45", kitchenArea: "Plating Area" },
  { id: "K009", employeeId: "E003", action: "Exited Kitchen", timestamp: "19:47", kitchenArea: "Main Kitchen" },
  { id: "K010", employeeId: "E002", action: "Exited Kitchen", timestamp: "19:48", kitchenArea: "Main Kitchen" },
];

export const accessCards = [
  { id: "A001", employeeId: "E001", accessArea: "Kitchen", accessTime: "19:24", action: "Entry" },
  { id: "A002", employeeId: "E002", accessArea: "Kitchen", accessTime: "19:30", action: "Entry" },
  { id: "A003", employeeId: "E003", accessArea: "Kitchen", accessTime: "19:44", action: "Entry" },
  { id: "A004", employeeId: "E004", accessArea: "Kitchen", accessTime: "19:35", action: "Entry" },
  { id: "A005", employeeId: "E003", accessArea: "Kitchen", accessTime: "19:47", action: "Exit" },
  { id: "A006", employeeId: "E002", accessArea: "Kitchen", accessTime: "19:48", action: "Exit" },
  { id: "A007", employeeId: "E001", accessArea: "Kitchen", accessTime: "19:51", action: "Exit" },
  { id: "A008", employeeId: "E004", accessArea: "Kitchen", accessTime: "19:52", action: "Exit" },
  { id: "A009", employeeId: "E003", accessArea: "Staff Office", accessTime: "20:03", action: "Entry" },
  { id: "A010", employeeId: "E003", accessArea: "Staff Office", accessTime: "20:11", action: "Exit" },
];

export const bankAccounts = [
  { id: "B001", accountNumber: "48120591", ownerType: "Employee", ownerId: "E001" },
  { id: "B002", accountNumber: "57231864", ownerType: "Employee", ownerId: "E002" },
  { id: "B003", accountNumber: "69342178", ownerType: "Employee", ownerId: "E003" },
  { id: "B004", accountNumber: "81452963", ownerType: "Employee", ownerId: "E004" },
  { id: "B005", accountNumber: "92561743", ownerType: "Employee", ownerId: "E005" },
  { id: "B006", accountNumber: "34681295", ownerType: "Employee", ownerId: "E006" },
  { id: "B007", accountNumber: "75193426", ownerType: "Employee", ownerId: "E007" },
  { id: "B008", accountNumber: "62845197", ownerType: "Employee", ownerId: "E008" },
  { id: "B009", accountNumber: "51736284", ownerType: "Guest", ownerId: "G008" },
  { id: "B010", accountNumber: "83219475", ownerType: "Guest", ownerId: "G005" },
];

export const payments = [
  { id: "P001", senderAccount: "B010", receiverAccount: "B002", amount: 12000, paymentTime: "18:12", description: "Consulting" },
  { id: "P002", senderAccount: "B005", receiverAccount: "B007", amount: 8500, paymentTime: "17:43", description: "Staff Expense" },
  { id: "P003", senderAccount: "B009", receiverAccount: "B003", amount: 50000, paymentTime: "18:56", description: null },
  { id: "P004", senderAccount: "B001", receiverAccount: "B008", amount: 4500, paymentTime: "16:22", description: "Personal" },
  { id: "P005", senderAccount: "B006", receiverAccount: "B005", amount: 9200, paymentTime: "15:31", description: "Supplies" },
  { id: "P006", senderAccount: "B004", receiverAccount: "B007", amount: 3800, paymentTime: "17:12", description: "Reimbursement" },
  { id: "P007", senderAccount: "B008", receiverAccount: "B006", amount: 6700, paymentTime: "14:50", description: "Maintenance" },
  { id: "P008", senderAccount: "B002", receiverAccount: "B001", amount: 2500, paymentTime: "13:45", description: "Loan" },
  { id: "P009", senderAccount: "B005", receiverAccount: "B010", amount: 11000, paymentTime: "12:32", description: "Contractor" },
  { id: "P010", senderAccount: "B007", receiverAccount: "B004", amount: 1800, paymentTime: "11:21", description: "Reimbursement" },
];

export const phoneRecords = [
  { id: "PR001", phoneNumber: "9876500011", ownerId: "E001", associatedAccount: "B001", callTime: "18:10", duration: 120 },
  { id: "PR002", phoneNumber: "9876500022", ownerId: "E002", associatedAccount: "B002", callTime: "18:22", duration: 90 },
  { id: "PR003", phoneNumber: "9876500033", ownerId: "E003", associatedAccount: "B003", callTime: "18:54", duration: 45 },
  { id: "PR004", phoneNumber: "9876500044", ownerId: "E004", associatedAccount: "B004", callTime: "18:30", duration: 180 },
  { id: "PR005", phoneNumber: "9876500055", ownerId: "E005", associatedAccount: "B005", callTime: "18:41", duration: 60 },
  { id: "PR006", phoneNumber: "9876500066", ownerId: "E006", associatedAccount: "B006", callTime: "18:20", duration: 120 },
  { id: "PR007", phoneNumber: "9876500077", ownerId: "E007", associatedAccount: "B007", callTime: "18:15", duration: 30 },
  { id: "PR008", phoneNumber: "9876500088", ownerId: "E008", associatedAccount: "B008", callTime: "18:05", duration: 240 },
  { id: "PR009", phoneNumber: "9876500099", ownerId: "G008", associatedAccount: "B009", callTime: "18:51", duration: 300 },
  { id: "PR010", phoneNumber: "9876500010", ownerId: "G005", associatedAccount: "B010", callTime: "17:48", duration: 90 },
];
