// @ts-nocheck
import React, { useCallback, useEffect, useState } from "react";
import { type FieldErrors, type UseFormRegister, type UseFormRegisterReturn, useForm } from "react-hook-form";
import toast from "react-hot-toast";

import api from "../api";

function getDeleteEndpoint(u: AdminUser): string {
	return u.role === "doctor" ? `/admin/doctors/${u.doctor?.id}` : `/admin/assistants/${u.assistant?.id}`;
}

function getSubmitAction(modalMode: string, selected: AdminUser | null, values: FormValues): Promise<unknown> {
	if (modalMode === "create-doctor") return api.post("/admin/doctors", values);
	if (modalMode === "edit-doctor") return api.put(`/admin/doctors/${selected!.doctor?.id}`, values);
	if (modalMode === "create-assistant") return api.post("/admin/assistants", values);
	return api.put(`/admin/assistants/${selected!.assistant?.id}`, values);
}

interface AdminUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	doctor?: { id: string; specialization: string; licenseNumber: string };
	assistant?: { id: string; department: string };
}

interface FormValues {
	firstName: string;
	lastName: string;
	email: string;
	specialization?: string;
	licenseNumber?: string;
	department?: string;
}

export default function AdminPage(): React.ReactElement {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState<"doctors" | "assistants">("doctors");

	const [modalOpen, setModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create-doctor" | "edit-doctor" | "create-assistant" | "edit-assistant">(
		"create-doctor"
	);
	const [selected, setSelected] = useState<AdminUser | null>(null);
	const [saving, setSaving] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

	const {
		register,
		handleSubmit: rhfSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>();

	const load = useCallback(() => {
		setLoading(true);
		void api
			.get<{ data: AdminUser[] }>("/admin/users")
			.then(r => setUsers(r.data.data))
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const doctors = users.filter(u => u.role === "doctor");
	const assistants = users.filter(u => u.role === "assistant");

	const openCreate = (type: "doctor" | "assistant"): void => {
		setSelected(null);
		reset({ firstName: "", lastName: "", email: "", specialization: "", licenseNumber: "", department: "" });
		setModalMode(type === "doctor" ? "create-doctor" : "create-assistant");
		setModalOpen(true);
	};

	const openEdit = (u: AdminUser): void => {
		setSelected(u);
		const base = { firstName: u.firstName, lastName: u.lastName, email: u.email };
		if (u.role === "doctor") {
			reset({ ...base, specialization: u.doctor?.specialization, licenseNumber: u.doctor?.licenseNumber });
			setModalMode("edit-doctor");
		} else {
			reset({ ...base, department: u.assistant?.department });
			setModalMode("edit-assistant");
		}
		setModalOpen(true);
	};

	const handleDelete = async (u: AdminUser): Promise<void> => {
		try {
			await api.delete(getDeleteEndpoint(u));
			toast.success("User removed.");
			setDeleteConfirm(null);
			load();
		} catch {
			toast.error("Could not remove user.");
		}
	};

	const onModalSubmit = async (values: FormValues): Promise<void> => {
		setSaving(true);
		try {
			await getSubmitAction(modalMode, selected, values);
			toast.success("Saved!");
			setModalOpen(false);
			load();
		} catch {
			toast.error("Could not save.");
		} finally {
			setSaving(false);
		}
	};

	const isDoctor = modalMode.includes("doctor");
	const isEdit = modalMode.startsWith("edit");

	return (
		<div>
			<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h1 className="text-2xl font-bold text-brand-navy">Admin — User Management</h1>
				<button className="btn-primary" onClick={() => openCreate(tab === "doctors" ? "doctor" : "assistant")}>
					+ Add {tab === "doctors" ? "doctor" : "assistant"}
				</button>
			</div>

			<div className="card">
				<div className="flex gap-1 border-b border-gray-200 mb-4">
					<button
						className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
							tab === "doctors"
								? "border-brand-primary text-brand-primary"
								: "border-transparent text-gray-500 hover:text-gray-700"
						}`}
						onClick={() => setTab("doctors")}
					>
						Doctors ({doctors.length})
					</button>
					<button
						className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
							tab === "assistants"
								? "border-brand-primary text-brand-primary"
								: "border-transparent text-gray-500 hover:text-gray-700"
						}`}
						onClick={() => setTab("assistants")}
					>
						Assistants ({assistants.length})
					</button>
				</div>
				{tab === "doctors" ? (
					<UserTable
						data={doctors}
						type="doctor"
						loading={loading}
						deleteConfirm={deleteConfirm}
						onEdit={openEdit}
						onDeleteConfirm={setDeleteConfirm}
						onDelete={handleDelete}
					/>
				) : (
					<UserTable
						data={assistants}
						type="assistant"
						loading={loading}
						deleteConfirm={deleteConfirm}
						onEdit={openEdit}
						onDeleteConfirm={setDeleteConfirm}
						onDelete={handleDelete}
					/>
				)}
			</div>

			{modalOpen && (
				<UserFormModal
					isDoctor={isDoctor}
					isEdit={isEdit}
					saving={saving}
					register={register}
					errors={errors}
					onSubmit={e => {
						void rhfSubmit(onModalSubmit)(e);
					}}
					onClose={() => setModalOpen(false)}
				/>
			)}
		</div>
	);
}

function UserFormModal({
	isDoctor,
	isEdit,
	saving,
	register,
	errors,
	onSubmit,
	onClose,
}: {
	isDoctor: boolean;
	isEdit: boolean;
	saving: boolean;
	register: UseFormRegister<FormValues>;
	errors: FieldErrors<FormValues>;
	onSubmit: (e: React.BaseSyntheticEvent) => void;
	onClose: () => void;
}): React.ReactElement {
	const dialogTitle = `${isEdit ? "Edit" : "Add"} ${isDoctor ? "doctor" : "assistant"}`;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
			<div className="absolute inset-0 bg-black/30" />
			<div
				className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
				role="dialog"
				aria-modal="true"
				aria-labelledby="user-form-title"
				onClick={e => e.stopPropagation()}
			>
				<h2 id="user-form-title" className="text-lg font-bold text-brand-navy mb-4">
					{dialogTitle}
				</h2>
				<form onSubmit={onSubmit} className="space-y-3">
					<UserFormField
						label="First name"
						inputId="user-form-first-name"
						registration={register("firstName", { required: "Required" })}
						errorMessage={errors.firstName?.message}
					/>
					<UserFormField
						label="Last name"
						inputId="user-form-last-name"
						registration={register("lastName", { required: "Required" })}
						errorMessage={errors.lastName?.message}
					/>
					<UserFormField
						label="Email"
						inputId="user-form-email"
						registration={register("email", {
							required: "Required",
							pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
						})}
						errorMessage={errors.email?.message}
						type="email"
						disabled={isEdit}
					/>
					{isDoctor ? (
						<>
							<UserFormField
								label="Specialization"
								inputId="user-form-specialization"
								registration={register("specialization", { required: "Required" })}
								errorMessage={errors.specialization?.message}
							/>
							<UserFormField
								label="License number"
								inputId="user-form-license-number"
								registration={register("licenseNumber", { required: "Required" })}
								errorMessage={errors.licenseNumber?.message}
							/>
						</>
					) : (
						<UserFormField
							label="Department"
							inputId="user-form-department"
							registration={register("department", { required: "Required" })}
							errorMessage={errors.department?.message}
						/>
					)}

					<div className="flex gap-2 justify-end pt-2">
						<button type="button" className="btn-ghost" onClick={onClose}>
							Cancel
						</button>
						<button type="submit" className="btn-primary" disabled={saving}>
							{saving ? "Saving..." : "Save"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function UserFormField({
	label,
	inputId,
	registration,
	errorMessage,
	type = "text",
	disabled,
}: {
	label: string;
	inputId: string;
	registration: UseFormRegisterReturn;
	errorMessage?: string;
	type?: string;
	disabled?: boolean;
}): React.ReactElement {
	return (
		<div>
			<label className="form-label" htmlFor={inputId}>
				{label}
			</label>
			<input
				{...registration}
				id={inputId}
				type={type}
				disabled={disabled}
				aria-invalid={errorMessage ? true : undefined}
				aria-describedby={errorMessage ? `${inputId}-error` : undefined}
				className="form-input w-full disabled:opacity-50"
			/>
			{errorMessage && (
				<p id={`${inputId}-error`} className="text-red-500 text-xs mt-1">
					{errorMessage}
				</p>
			)}
		</div>
	);
}

function UserTable({
	data,
	type,
	loading,
	deleteConfirm,
	onEdit,
	onDeleteConfirm,
	onDelete,
}: {
	data: AdminUser[];
	type: "doctor" | "assistant";
	loading: boolean;
	deleteConfirm: string | null;
	onEdit: (u: AdminUser) => void;
	onDeleteConfirm: (id: string | null) => void;
	onDelete: (u: AdminUser) => Promise<void>;
}): React.ReactElement {
	return (
		<div className="overflow-x-auto">
			{loading && <p className="text-gray-400 text-sm">Loading...</p>}
			{!loading && data.length === 0 && <p className="text-gray-400 text-sm">No {type}s found.</p>}
			{!loading && data.length > 0 && (
				<table className="w-full text-sm min-w-[500px]">
					<thead className="border-b border-gray-100">
						<tr>
							<th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Name</th>
							<th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Email</th>
							<th className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
								{type === "doctor" ? "Specialization" : "Department"}
							</th>
							<th className="px-3 py-2 w-36"></th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-50">
						{data.map(u => (
							<tr key={u.id} className="hover:bg-gray-50 transition-colors">
								<td className="px-3 py-2 font-medium text-brand-navy">
									{u.firstName} {u.lastName}
								</td>
								<td className="px-3 py-2 text-gray-600">{u.email}</td>
								<td className="px-3 py-2 text-gray-500">
									{type === "doctor" ? (u.doctor?.specialization ?? "—") : (u.assistant?.department ?? "—")}
								</td>
								<td className="px-3 py-2">
									<div className="flex gap-2 items-center relative">
										<button
											className="btn-link"
											aria-label={`Edit ${type} ${u.firstName} ${u.lastName}`}
											onClick={() => onEdit(u)}
										>
											Edit
										</button>
										<button
											className="btn-link-danger"
											aria-label={`Delete ${type} ${u.firstName} ${u.lastName}`}
											onClick={() => onDeleteConfirm(u.id)}
										>
											Delete
										</button>
										{deleteConfirm === u.id && (
											<div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-[180px]">
												<p className="text-sm text-gray-600 mb-2">Remove this {type}?</p>
												<div className="flex gap-2 justify-end">
													<button className="btn-ghost text-xs" onClick={() => onDeleteConfirm(null)}>
														No
													</button>
													<button
														className="btn-primary text-xs"
														onClick={() => {
															void onDelete(u);
														}}
													>
														Yes
													</button>
												</div>
											</div>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
