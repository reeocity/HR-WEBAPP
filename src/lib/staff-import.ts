import * as XLSX from "xlsx";

export type StaffImportRow = {
  staffId?: string;
  fullName: string;
  department: string;
  position: string;
  resumptionDate: Date;
  monthlySalary: number;
  status?: string;
  phone?: string;
  bankDetails?: string;
  bankName?: string;
  guarantor1Name?: string;
  guarantor1Phone?: string;
  guarantor2Name?: string;
  guarantor2Phone?: string;
};

export type StaffImportError = {
  rowNumber: number;
  message: string;
};

const REQUIRED_HEADERS = ["fullname", "department", "position", "resumption date", "monthly salary"] as const;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function formatResumptionDate(input: unknown): string | null {
  if (!input) return null;

  // Excel serial number
  if (typeof input === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + input * 24 * 60 * 60 * 1000);
    return `${String(date.getUTCDate()).padStart(2, "0")}/${String(
      date.getUTCMonth() + 1
    ).padStart(2, "0")}/${date.getUTCFullYear()}`;
  }

  if (input instanceof Date && !isNaN(input.getTime())) {
    return `${String(input.getDate()).padStart(2, "0")}/${String(
      input.getMonth() + 1
    ).padStart(2, "0")}/${input.getFullYear()}`;
  }

  if (typeof input === "string") {
    // Normalize separators and try to parse common formats
    const normalized = input.trim().replace(/\./g, "/").replace(/-/g, "/");
    const parts = normalized.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const yearStr = y.length === 2 ? `20${y}` : y;
      const month = Number(m);
      const day = Number(d);
      const year = Number(yearStr);
      if (
        Number.isFinite(day) &&
        Number.isFinite(month) &&
        Number.isFinite(year) &&
        day >= 1 &&
        day <= 31 &&
        month >= 1 &&
        month <= 12
      ) {
        return `${String(day).padStart(2, "0")}/${String(month).padStart(
          2,
          "0"
        )}/${year}`;
      }
    }

    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return `${String(parsed.getDate()).padStart(2, "0")}/${String(
        parsed.getMonth() + 1
      ).padStart(2, "0")}/${parsed.getFullYear()}`;
    }
  }

  return null;
}

export function parseStaffWorkbook(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      rows: [] as StaffImportRow[],
      errors: [{ rowNumber: 1, message: "No worksheet found." }] as StaffImportError[],
      hasGuarantorColumns: false,
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<(string | number | Date)[]>(sheet, {
    header: 1,
    raw: true,
    blankrows: false,
  });

  if (rawRows.length === 0) {
    return {
      rows: [] as StaffImportRow[],
      errors: [{ rowNumber: 1, message: "The worksheet is empty." }] as StaffImportError[],
      hasGuarantorColumns: false,
    };
  }

  const headers = rawRows[0].map((value) => normalizeHeader(String(value ?? "")));
  const headerIndex: Record<string, number> = {};
  headers.forEach((header, index) => {
    if (header) headerIndex[header] = index;
  });

  const missingHeaders = REQUIRED_HEADERS.filter((required) => !(required in headerIndex));
  const errors: StaffImportError[] = [];

  if (missingHeaders.length) {
    errors.push({
      rowNumber: 1,
      message: `Missing required columns: ${missingHeaders.join(", ")}`,
    });
  }

  const hasGuarantorColumns =
    "guarantor 1 name" in headerIndex ||
    "guarantor 1 phone" in headerIndex ||
    "guarantor 2 name" in headerIndex ||
    "guarantor 2 phone" in headerIndex;

  const rows: StaffImportRow[] = [];

  for (let i = 1; i < rawRows.length; i += 1) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const rowNumber = i + 1;
    const getValue = (header: string) => {
      const index = headerIndex[header];
      return index === undefined ? undefined : row[index];
    };

    const staffIdValue = getValue("staff id");
    const fullNameValue = getValue("fullname") ?? getValue("full name");
    const departmentValue = getValue("department");
    const positionValue = getValue("position");
    const resumptionValue = getValue("resumption date");
    const salaryValue = getValue("monthly salary");

    if (!fullNameValue || !departmentValue || !positionValue || !resumptionValue || !salaryValue) {
      errors.push({ rowNumber, message: "Required fields are missing." });
      continue;
    }

    const resumptionDateStr = formatResumptionDate(resumptionValue);
    if (!resumptionDateStr) {
      errors.push({ rowNumber, message: "Invalid resumption date." });
      continue;
    }
    const [day, month, year] = resumptionDateStr.split("/").map(Number);
    const resumptionDate = new Date(year, month - 1, day);
    if (isNaN(resumptionDate.getTime())) {
      errors.push({ rowNumber, message: "Invalid resumption date format." });
      continue;
    }

    const monthlySalary = parseNumber(salaryValue);
    if (monthlySalary === null) {
      errors.push({ rowNumber, message: "Invalid monthly salary." });
      continue;
    }

    rows.push({
      staffId: staffIdValue ? String(staffIdValue).trim() : undefined,
      fullName: String(fullNameValue).trim(),
      department: String(departmentValue).trim(),
      position: String(positionValue).trim(),
      resumptionDate,
      monthlySalary,
      status: getValue("status") ? String(getValue("status")).trim() : undefined,
      phone: getValue("phone") ? String(getValue("phone")).trim() : undefined,
      bankDetails: getValue("bank details") ? String(getValue("bank details")).trim() : undefined,
      bankName: getValue("bank name") ? String(getValue("bank name")).trim() : undefined,
      guarantor1Name: getValue("guarantor 1 name")
        ? String(getValue("guarantor 1 name")).trim()
        : undefined,
      guarantor1Phone: getValue("guarantor 1 phone")
        ? String(getValue("guarantor 1 phone")).trim()
        : undefined,
      guarantor2Name: getValue("guarantor 2 name")
        ? String(getValue("guarantor 2 name")).trim()
        : undefined,
      guarantor2Phone: getValue("guarantor 2 phone")
        ? String(getValue("guarantor 2 phone")).trim()
        : undefined,
    });
  }

  return { rows, errors, hasGuarantorColumns };
}
