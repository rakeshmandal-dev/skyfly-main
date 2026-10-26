import { Router } from "express";

export const pyqsRouter = Router();

const PAPERS = [
  { id: "p1", university: "AKTU", semester: "Sem 3", subject: "Data Structures", year: 2024, questions: 40 },
  { id: "p2", university: "AKTU", semester: "Sem 3", subject: "Data Structures", year: 2023, questions: 40 },
  { id: "p3", university: "DTU", semester: "Sem 2", subject: "Engineering Mathematics", year: 2024, questions: 35 },
  { id: "p4", university: "IITB", semester: "Sem 1", subject: "Physics", year: 2023, questions: 30 },
  { id: "p5", university: "NTA", semester: "JEE Main", subject: "Chemistry", year: 2024, questions: 75 },
  { id: "p6", university: "NTA", semester: "NEET", subject: "Biology", year: 2024, questions: 90 },
  { id: "p7", university: "CBSE", semester: "Class 12", subject: "Mathematics", year: 2024, questions: 38 },
  { id: "p8", university: "CBSE", semester: "Class 12", subject: "Physics", year: 2023, questions: 33 },
  { id: "p9", university: "VTU", semester: "Sem 4", subject: "Operating Systems", year: 2024, questions: 40 },
  { id: "p10", university: "MU", semester: "Sem 5", subject: "Computer Networks", year: 2023, questions: 40 },
  { id: "p11", university: "AKTU", semester: "Sem 4", subject: "DBMS", year: 2024, questions: 40 },
  { id: "p12", university: "GTU", semester: "Sem 3", subject: "Digital Electronics", year: 2023, questions: 35 },
];

pyqsRouter.get("/pyqs", (req, res) => {
  const { university, subject, year, query } = req.query as Record<string, string>;

  let filtered = PAPERS;
  if (university && university !== "All") {
    filtered = filtered.filter((p) => p.university === university);
  }
  if (subject && subject !== "All") {
    filtered = filtered.filter((p) => p.subject === subject);
  }
  if (year && year !== "All") {
    filtered = filtered.filter((p) => String(p.year) === year);
  }
  if (query) {
    filtered = filtered.filter((p) => p.subject.toLowerCase().includes(query.toLowerCase()));
  }

  res.json({
    success: true,
    papers: filtered,
    total: filtered.length,
  });
});
