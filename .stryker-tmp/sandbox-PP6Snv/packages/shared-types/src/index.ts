// @ts-nocheck
function stryNS_9fa48() {
	var g =
		(typeof globalThis === "object" && globalThis && globalThis.Math === Math && globalThis) ||
		new Function("return this")();
	var ns = g.__stryker__ || (g.__stryker__ = {});
	if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
		ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
	}
	function retrieveNS() {
		return ns;
	}
	stryNS_9fa48 = retrieveNS;
	return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
	var ns = stryNS_9fa48();
	var cov =
		ns.mutantCoverage ||
		(ns.mutantCoverage = {
			static: {},
			perTest: {},
		});
	function cover() {
		var c = cov.static;
		if (ns.currentTestId) {
			c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
		}
		var a = arguments;
		for (var i = 0; i < a.length; i++) {
			c[a[i]] = (c[a[i]] || 0) + 1;
		}
	}
	stryCov_9fa48 = cover;
	cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
	var ns = stryNS_9fa48();
	function isActive(id) {
		if (ns.activeMutant === id) {
			if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
				throw new Error("Stryker: Hit count limit reached (" + ns.hitCount + ")");
			}
			return true;
		}
		return false;
	}
	stryMutAct_9fa48 = isActive;
	return isActive(id);
}
export type UserRole = "patient" | "doctor" | "assistant" | "admin";
export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

/** Valid status transitions. Terminal states (COMPLETED, CANCELLED) have empty arrays. */
export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = stryMutAct_9fa48("62")
	? {}
	: (stryCov_9fa48("62"),
		{
			SCHEDULED: stryMutAct_9fa48("63")
				? []
				: (stryCov_9fa48("63"),
					[
						stryMutAct_9fa48("64") ? "" : (stryCov_9fa48("64"), "CONFIRMED"),
						stryMutAct_9fa48("65") ? "" : (stryCov_9fa48("65"), "CANCELLED"),
					]),
			CONFIRMED: stryMutAct_9fa48("66")
				? []
				: (stryCov_9fa48("66"),
					[
						stryMutAct_9fa48("67") ? "" : (stryCov_9fa48("67"), "COMPLETED"),
						stryMutAct_9fa48("68") ? "" : (stryCov_9fa48("68"), "CANCELLED"),
					]),
			COMPLETED: stryMutAct_9fa48("69") ? ["Stryker was here"] : (stryCov_9fa48("69"), []),
			CANCELLED: stryMutAct_9fa48("70") ? ["Stryker was here"] : (stryCov_9fa48("70"), []),
		});
export interface User {
	id: string;
	keycloakId: string;
	email: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	createdAt: string;
	deletedAt?: string | null;
}
export interface Patient {
	id: string;
	userId: string;
	dateOfBirth?: string | null;
	phone?: string | null;
	insuranceNumber?: string | null;
	photo?: string | null;
	user?: User;
}
export interface Doctor {
	id: string;
	userId: string;
	specialization?: string | null;
	licenseNumber?: string | null;
	user?: User;
}
export interface Assistant {
	id: string;
	userId: string;
	department?: string | null;
	user?: User;
}
export interface Appointment {
	id: string;
	patientId: string;
	doctorId: string;
	assistantId?: string | null;
	scheduledAt: string;
	status: AppointmentStatus;
	notes?: string | null;
	createdAt: string;
	updatedAt: string;
	patient?: Patient;
	doctor?: Doctor;
	assistant?: Assistant | null;
}

// --- API Request/Response shapes ---

export interface CreateAppointmentDto {
	patientId: string;
	doctorId: string;
	scheduledAt: string;
	notes?: string;
}
export interface UpdateAppointmentDto {
	scheduledAt?: string;
	status?: AppointmentStatus;
	notes?: string;
}
export interface CreateDoctorDto {
	email: string;
	firstName: string;
	lastName: string;
	specialization?: string;
	licenseNumber?: string;
	password: string;
}
export interface UpdateDoctorDto {
	firstName?: string;
	lastName?: string;
	specialization?: string;
	licenseNumber?: string;
}
export interface CreateAssistantDto {
	email: string;
	firstName: string;
	lastName: string;
	department?: string;
	password: string;
}
export interface UpdateAssistantDto {
	firstName?: string;
	lastName?: string;
	department?: string;
}
export interface SyncUserDto {
	keycloakId: string;
	email: string;
	firstName: string;
	lastName: string;
}
export interface UpdateProfileDto {
	firstName?: string;
	lastName?: string;
	dateOfBirth?: string;
	phone?: string;
	insuranceNumber?: string;
}
export interface ApiResponse<T> {
	data: T;
	message?: string;
}
export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
}
export interface AppointmentFilters {
	status?: AppointmentStatus;
	from?: string;
	to?: string;
	doctorId?: string;
	patientId?: string;
}
export interface AppointmentStatusChange {
	id: string;
	appointmentId: string;
	previousStatus?: AppointmentStatus | null;
	newStatus: AppointmentStatus;
	previousScheduledAt?: string | null;
	newScheduledAt?: string | null;
	changedByKeycloakId: string;
	changedByName?: string | null;
	changedAt: string;
}
export interface RescheduleAppointmentDto {
	scheduledAt: string;
}
export interface DoctorSlotAvailability {
	date: string;
	slots: string[];
}
export interface AppointmentStats {
	todayCount: number;
	upcomingCount: number;
	completedCount: number;
	cancelledCount: number;
	totalCount: number;
	byStatus: Record<AppointmentStatus, number>;
}

/** Lightweight doctor info for public listing (patient portal) */
export interface DoctorPublic {
	id: string;
	userId: string;
	specialization?: string | null;
	firstName: string;
	lastName: string;
	averageRating?: number | null;
	reviewCount?: number;
}

// --- Reviews ---

export interface Review {
	id: string;
	appointmentId: string;
	patientId: string;
	doctorId: string;
	rating: number;
	comment?: string | null;
	createdAt: string;
	patient?: Patient;
	doctor?: Doctor;
	appointment?: Appointment;
}
export interface CreateReviewDto {
	rating: number;
	comment?: string;
}
export interface DoctorReviewStats {
	averageRating: number;
	totalReviews: number;
}

// --- Doctor Unavailability ---

export interface DoctorUnavailability {
	id: string;
	doctorId: string;
	startDate: string;
	endDate: string;
	reason?: string | null;
	createdAt: string;
}
export interface CreateUnavailabilityDto {
	startDate: string;
	endDate: string;
	reason?: string;
}

// --- Prescriptions ---

export interface PrescriptionItem {
	id: string;
	prescriptionId: string;
	medicationName: string;
	dosage: string;
	frequency: string;
	duration: string;
	instructions?: string | null;
}
export interface Prescription {
	id: string;
	appointmentId: string;
	patientId: string;
	doctorId: string;
	notes?: string | null;
	createdAt: string;
	updatedAt: string;
	items: PrescriptionItem[];
	patient?: Patient;
	doctor?: Doctor;
	appointment?: Appointment;
}
export interface CreatePrescriptionItemDto {
	medicationName: string;
	dosage: string;
	frequency: string;
	duration: string;
	instructions?: string;
}
export interface CreatePrescriptionDto {
	appointmentId: string;
	notes?: string;
	items: CreatePrescriptionItemDto[];
}
export interface UpdatePrescriptionDto {
	notes?: string;
	items?: CreatePrescriptionItemDto[];
}

// --- Feature Toggles ---

export interface FeatureToggle {
	id: string;
	key: string;
	enabled: boolean;
	description?: string | null;
	config?: Record<string, unknown> | null;
	updatedAt: string;
	createdAt: string;
}
export interface UpdateFeatureToggleDto {
	enabled?: boolean;
	config?: Record<string, unknown>;
}

/** Known feature toggle keys */
export const FEATURE_TOGGLE_KEYS = {
	API_SLOWDOWN: "bug:api-slowdown",
	SAME_DAY_RESTRICTION: "bug:same-day-restriction",
	PROFILE_VALIDATION_FRONTEND: "bug:profile-validation-frontend",
	PROFILE_VALIDATION_BACKEND: "bug:profile-validation-backend",
	SHOW_FOOTER_LOGO: "bug:show-footer-logo",
} as const;
export interface ApiSlowdownConfig {
	minDelayMs: number;
	maxDelayMs: number;
}
