
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import { getAdminToken } from "../config/auth";

const emptyForm = () => ({
  title: "",
  message: "",
  image_url: "",
  start_date: new Date().toLocaleDateString("en-CA"),
  end_date: new Date().toLocaleDateString("en-CA"),
  show_on_home: true,
  show_on_dashboard: true,
  show_on_renewal: true,
  is_active: true,
});

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.message || data.error || "Something went wrong.";
  } catch {
    return `Request failed (${response.status}).`;
  }
};

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const token = getAdminToken();

  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const loadAnnouncements = useCallback(async () => {
    if (!token) {
      navigate("/admin-login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/announcements/admin`, {
        headers,
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        navigate("/admin-login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError(err.message || "Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const updateField = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setSelectedFile(null);
    setPreview(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const uploadImage = async () => {
    if (!selectedFile) return form.image_url;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch(`${API_URL}/announcements/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();
      const imageUrl = data.image_url || data.imageUrl || data.url;

      if (!imageUrl) {
        throw new Error("Image uploaded, but the image URL was not returned.");
      }

      return imageUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.message.trim()) {
      setError("Please enter both a title and announcement message.");
      return;
    }

    if (!form.start_date || !form.end_date) {
      setError("Please select the announcement start and end dates.");
      return;
    }

    if (form.end_date < form.start_date) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (
      !form.show_on_home &&
      !form.show_on_dashboard &&
      !form.show_on_renewal
    ) {
      setError("Select at least one announcement placement.");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = form.image_url;

      if (selectedFile) {
        imageUrl = await uploadImage();
      }

      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        image_url: imageUrl || null,
        start_date: form.start_date,
        end_date: form.end_date,
        show_on_home: form.show_on_home,
        show_on_dashboard: form.show_on_dashboard,
        show_on_renewal: form.show_on_renewal,
        is_active: form.is_active,
      };

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `${API_URL}/announcements/${editingId}`
          : `${API_URL}/announcements`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setSuccess(
        isEditing
          ? "Announcement updated successfully."
          : "Announcement created successfully."
      );

      resetForm();
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Unable to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (announcement) => {
    setForm({
      title: announcement.title || "",
      message: announcement.message || "",
      image_url: announcement.image_url || "",
      start_date: announcement.start_date || "",
      end_date: announcement.end_date || "",
      show_on_home: announcement.show_on_home ?? true,
      show_on_dashboard: announcement.show_on_dashboard ?? true,
      show_on_renewal: announcement.show_on_renewal ?? true,
      is_active: announcement.is_active ?? true,
    });

    setEditingId(announcement.id);
    setSelectedFile(null);
    setPreview(false);
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleStatus = async (announcement) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/announcements/${announcement.id}`,
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !announcement.is_active,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setSuccess(
        announcement.is_active
          ? "Announcement paused."
          : "Announcement activated."
      );

      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Unable to change announcement status.");
    }
  };

  const handleDelete = async (announcement) => {
    const confirmed = window.confirm(
      `Delete "${announcement.title}" permanently?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(announcement.id);

    try {
      const response = await fetch(
        `${API_URL}/announcements/${announcement.id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      if (editingId === announcement.id) {
        resetForm();
      }

      setSuccess("Announcement deleted successfully.");
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Unable to delete announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  const today = new Date().toLocaleDateString("en-CA");

  const getDisplayStatus = (announcement) => {
    if (!announcement.is_active) return "Paused";
    if (announcement.start_date > today) return "Scheduled";
    if (announcement.end_date < today) return "Expired";
    return "Live";
  };

  const getStatusClass = (status) => {
    if (status === "Live") return "bg-green-100 text-green-700";
    if (status === "Scheduled") return "bg-blue-100 text-blue-700";
    if (status === "Expired") return "bg-gray-100 text-gray-600";
    return "bg-orange-100 text-orange-700";
  };

  const imagePreviewUrl = selectedFile
    ? URL.createObjectURL(selectedFile)
    : form.image_url;

  useEffect(() => {
    if (!selectedFile) return undefined;

    const url = URL.createObjectURL(selectedFile);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="mb-2 text-sm font-semibold text-slate-500 hover:text-rose-600"
            >
              ← Back to Admin Dashboard
            </button>

            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              📣 Announcements
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer announcements and their display dates.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnnouncements}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            ✓ {success}
          </div>
        )}

        {/* FORM */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-rose-50 to-pink-50 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? "✏️ Edit Announcement" : "＋ Create Announcement"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Set the message, image, display period and customer pages.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Announcement title *
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Example: Special Milk Offer"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Announcement message *
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Enter the announcement details..."
                  required
                  className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">
                  {form.message.length}/2000
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Start date *
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateField("start_date", e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  End date *
                </label>
                <input
                  type="date"
                  min={form.start_date}
                  value={form.end_date}
                  onChange={(e) => updateField("end_date", e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-rose-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Announcement image (optional)
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="block w-full rounded-xl border border-slate-300 p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-rose-50 file:px-4 file:py-2 file:font-semibold file:text-rose-700"
                />

                <p className="mt-1 text-xs text-slate-400">
                  JPG, PNG or WEBP. Maximum size: 5 MB.
                </p>

                {imagePreviewUrl && (
                  <div className="mt-3">
                    <img
                      src={imagePreviewUrl}
                      alt="Announcement preview"
                      className="max-h-52 max-w-full rounded-xl border border-slate-200 object-contain"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        updateField("image_url", "");
                      }}
                      className="mt-2 text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PLACEMENTS */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-bold text-slate-800">
                Where should customers see this announcement?
              </h3>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["show_on_home", "🏠 Home page"],
                  ["show_on_dashboard", "👤 Customer dashboard"],
                  ["show_on_renewal", "🔁 Renewal page"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(e) => updateField(key, e.target.checked)}
                      className="h-4 w-4 accent-rose-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* ACTIVE STATUS */}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField("is_active", e.target.checked)}
                className="h-4 w-4 accent-green-600"
              />
              <span>
                <span className="block text-sm font-bold text-slate-800">
                  Activate announcement
                </span>
                <span className="block text-xs text-slate-500">
                  It will display only during its selected date range.
                </span>
              </span>
            </label>

            {/* PREVIEW */}
            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {preview ? "Hide preview" : "Preview announcement"}
              </button>

              <button
                type="submit"
                disabled={saving || uploading}
                className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Uploading image..."
                  : saving
                  ? "Saving..."
                  : editingId
                  ? "Update announcement"
                  : "Create announcement"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel edit
                </button>
              )}
            </div>

            {preview && (
              <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-rose-600">
                  Customer preview
                </p>

                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt=""
                    className="mb-3 max-h-56 w-full rounded-xl object-cover"
                  />
                )}

                <h3 className="text-lg font-extrabold text-slate-900">
                  {form.title || "Announcement title"}
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {form.message || "Your announcement message will appear here."}
                </p>
              </div>
            )}
          </form>
        </section>

        {/* ANNOUNCEMENT LIST */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                All announcements
              </h2>
              <p className="text-sm text-slate-500">
                {announcements.length} announcement(s) created
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="text-4xl">📣</div>
              <h3 className="mt-3 font-bold text-slate-800">
                No announcements yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Create your first announcement using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {announcements.map((announcement) => {
                const status = getDisplayStatus(announcement);

                return (
                  <article
                    key={announcement.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    {announcement.image_url && (
                      <img
                        src={announcement.image_url}
                        alt={announcement.title}
                        className="h-44 w-full object-cover"
                      />
                    )}

                    <div className="space-y-3 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(status)}`}
                        >
                          {status}
                        </span>

                        <span className="text-xs text-slate-400">
                          {announcement.start_date} – {announcement.end_date}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {announcement.title}
                        </h3>

                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          {announcement.message}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {announcement.show_on_home && (
                          <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                            Home
                          </span>
                        )}

                        {announcement.show_on_dashboard && (
                          <span className="rounded-lg bg-purple-50 px-2.5 py-1 font-medium text-purple-700">
                            Dashboard
                          </span>
                        )}

                        {announcement.show_on_renewal && (
                          <span className="rounded-lg bg-orange-50 px-2.5 py-1 font-medium text-orange-700">
                            Renewal
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => handleEdit(announcement)}
                          className="rounded-lg bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(announcement)}
                          className="rounded-lg bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100"
                        >
                          {announcement.is_active ? "⏸ Pause" : "▶ Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(announcement)}
                          disabled={deletingId === announcement.id}
                          className="rounded-lg bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === announcement.id
                            ? "Deleting..."
                            : "🗑 Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
