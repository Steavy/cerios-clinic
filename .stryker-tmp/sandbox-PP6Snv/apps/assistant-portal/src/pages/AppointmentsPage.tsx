// @ts-nocheck
import type { Appointment } from "@clinic/shared-types";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api";

const STATUS_BADGE: Record<string, string> = {
	SCHEDULED: "badge-blue",
	CONFIRMED: "badge-green",
	COMPLETED: "badge-gray",
	CANCELLED: "badge-red",
};

const STATUSES = ["ALL", "SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

type SortColumn = "patient" | "date";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 50;

export default function AppointmentsPage(): React.ReactElement {
	const navigate = useNavigate();
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<(typeof STATUSES)[number]>("ALL");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortCol, setSortCol] = useState<SortColumn>("date");
	const [sortDir, setSortDir] = useState<SortDirection>("asc");
	const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
		return (): void => clearTimeout(t);
	}, [search]);

	const load = useCallback(
		(pageIndex: number, searchTerm: string, nextStatusFilter: string, col: SortColumn, dir: SortDirection) => {
			setLoading(true);
			const params: Record<string, string | number> = {
				limit: PAGE_SIZE,
				offset: pageIndex * PAGE_SIZE,
				sortBy: col,
				sortOrder: dir,
			};
			if (searchTerm) params.search = searchTerm;
			if (nextStatusFilter !== "ALL") params.status = nextStatusFilter;
			void api
				.get<{ data: Appointment[]; total: number }>("/appointments", { params })
				.then(r => {
					setAppointments(r.data.data);
					setTotal(r.data.total);
				})
				.catch(() => {})
				.finally(() => setLoading(false));
		},
		[]
	);

	useEffect(() => {
		load(page, debouncedSearch, statusFilter, sortCol, sortDir);
	}, [load, page, debouncedSearch, statusFilter, sortCol, sortDir]);

	const handleSort = (col: SortColumn): void => {
		setPage(0);
		if (sortCol === col) {
			setSortDir(d => (d === "asc" ? "desc" : "asc"));
			return;
		}
		setSortCol(col);
		setSortDir("asc");
	};

	const sortIndicator = (col: SortColumn): string => (sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : "↕");

	const handleCancel = async (id: string): Promise<void> => {
		await api.delete(`/appointments/${id}`);
		setCancelConfirm(null);
		load(page, debouncedSearch, statusFilter, sortCol, sortDir);
	};

	return (
		<div>
			<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h1 className="text-2xl font-bold text-brand-navy">Appointments</h1>
				<button
					className="btn-primary"
					onClick={() => {
						void navigate("/appointments/create");
					}}
				>
					+ New appointment
				</button>
			</div>

			<div className="card mb-4">
				<div className="flex gap-2 mb-4 flex-wrap">
					{STATUSES.map(s => (
						<button
							key={s}
							onClick={() => {
								setStatusFilter(s);
								setPage(0);
							}}
							className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
								statusFilter === s
									? "bg-brand-accent text-white"
									: "bg-white border border-gray-200 text-gray-500 hover:border-brand-accent hover:text-brand-accent"
							}`}
						>
							{s}
						</button>
					))}
				</div>
				<label className="sr-only" htmlFor="assistant-appointments-search">
					Search patient or doctor
				</label>
				<input
					id="assistant-appointments-search"
					type="text"
					placeholder="Search patient or doctor"
					className="form-input max-w-xs"
					value={search}
					onChange={e => {
						setSearch(e.target.value);
						setPage(0);
					}}
				/>
			</div>

			<div className="card">
				{loading && <p className="text-gray-400 text-sm">Loading...</p>}
				{!loading && appointments.length === 0 && <p className="text-gray-400 text-sm">No appointments found.</p>}
				{!loading && appointments.length > 0 && (
					<div className="overflow-x-auto">
						<table className="w-full text-sm min-w-[700px]">
							<thead className="border-b border-gray-100">
								<tr>
									<th
										className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase"
										aria-sort={sortCol === "date" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
									>
										<button
											type="button"
											className="inline-flex items-center gap-1 select-none hover:text-brand-accent focus:outline-none focus-visible:text-brand-accent"
											onClick={() => handleSort("date")}
										>
											<span>Date & Time</span>
											<span aria-hidden="true">{sortIndicator("date")}</span>
										</button>
									</th>
									<th
										className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase"
										aria-sort={sortCol === "patient" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
									>
										<button
											type="button"
											className="inline-flex items-center gap-1 select-none hover:text-brand-accent focus:outline-none focus-visible:text-brand-accent"
											onClick={() => handleSort("patient")}
										>
											<span>Patient</span>
											<span aria-hidden="true">{sortIndicator("patient")}</span>
										</button>
									</th>
									<th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Doctor</th>
									<th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase w-28">Status</th>
									<th className="px-3 py-2 w-36"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-50">
								{appointments.map(a => (
									<AppointmentTableRow
										key={a.id}
										appointment={a}
										cancelConfirm={cancelConfirm}
										onCancelConfirmChange={setCancelConfirm}
										onCancel={handleCancel}
										onEdit={id => {
											void navigate(`/appointments/${id}/edit`);
										}}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}
				{!loading && total > PAGE_SIZE && (
					<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
						<p className="text-xs text-gray-500">
							Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
						</p>
						<div className="flex gap-2">
							<button
								className="btn-ghost text-xs"
								disabled={page === 0}
								onClick={() => setPage(p => Math.max(0, p - 1))}
							>
								Previous
							</button>
							<button
								className="btn-ghost text-xs"
								disabled={(page + 1) * PAGE_SIZE >= total}
								onClick={() => setPage(p => p + 1)}
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function AppointmentTableRow({
	appointment,
	cancelConfirm,
	onCancelConfirmChange,
	onCancel,
	onEdit,
}: {
	appointment: Appointment;
	cancelConfirm: string | null;
	onCancelConfirmChange: React.Dispatch<React.SetStateAction<string | null>>;
	onCancel: (id: string) => Promise<void>;
	onEdit: (id: string) => void;
}): React.ReactElement {
	const scheduledAt = new Date(appointment.scheduledAt);
	const patientName = `${appointment.patient?.user?.firstName ?? "Unknown"} ${appointment.patient?.user?.lastName ?? "patient"}`;
	const doctorName = `Dr. ${appointment.doctor?.user?.firstName ?? "Unknown"} ${appointment.doctor?.user?.lastName ?? "doctor"}`;

	return (
		<tr className="hover:bg-gray-50 transition-colors">
			<td className="px-3 py-2 text-gray-600">
				{scheduledAt.toLocaleDateString("en-NL")}{" "}
				{scheduledAt.toLocaleTimeString("en-NL", { hour: "2-digit", minute: "2-digit" })}
			</td>
			<td className="px-3 py-2 font-medium text-brand-navy">{patientName}</td>
			<td className="px-3 py-2 text-gray-600">{doctorName}</td>
			<td className="px-3 py-2">
				<span className={STATUS_BADGE[appointment.status] ?? "badge-gray"}>{appointment.status}</span>
			</td>
			<AppointmentActions
				appointment={appointment}
				patientName={patientName}
				doctorName={doctorName}
				cancelConfirm={cancelConfirm}
				onCancelConfirmChange={onCancelConfirmChange}
				onCancel={onCancel}
				onEdit={onEdit}
			/>
		</tr>
	);
}

function AppointmentActions({
	appointment,
	patientName,
	doctorName,
	cancelConfirm,
	onCancelConfirmChange,
	onCancel,
	onEdit,
}: {
	appointment: Appointment;
	patientName: string;
	doctorName: string;
	cancelConfirm: string | null;
	onCancelConfirmChange: React.Dispatch<React.SetStateAction<string | null>>;
	onCancel: (id: string) => Promise<void>;
	onEdit: (id: string) => void;
}): React.ReactElement {
	return (
		<td className="px-3 py-2">
			<div className="flex gap-2 items-center relative">
				<button
					className="btn-link"
					aria-label={`Edit appointment for ${patientName} with ${doctorName}`}
					onClick={() => onEdit(appointment.id)}
				>
					Edit
				</button>
				{appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && (
					<>
						<button
							className="btn-link-danger"
							aria-label={`Cancel appointment for ${patientName} with ${doctorName}`}
							onClick={() => onCancelConfirmChange(appointment.id)}
						>
							Cancel
						</button>
						{cancelConfirm === appointment.id && (
							<div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[180px]">
								<p className="text-sm text-gray-600 mb-2">Cancel this appointment?</p>
								<div className="flex gap-2 justify-end">
									<button
										className="btn-ghost text-xs"
										aria-label={`Keep appointment for ${patientName} with ${doctorName}`}
										onClick={() => onCancelConfirmChange(null)}
									>
										No
									</button>
									<button
										className="btn-primary text-xs"
										aria-label={`Confirm cancel appointment for ${patientName} with ${doctorName}`}
										onClick={() => {
											void onCancel(appointment.id);
										}}
									>
										Yes
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</td>
	);
}
