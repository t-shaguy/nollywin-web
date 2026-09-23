"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Send, Bell, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  broadcastNotification,
  sendNotification,
  getSentNotifications,
} from "@/lib/api/admin";

type TabType = "compose" | "sent";
type ComposeMode = "broadcast" | "targeted";

interface BroadcastFormData {
  title: string;
  body: string;
}

interface TargetedFormData {
  emails: string;
  title: string;
  body: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("compose");
  const [composeMode, setComposeMode] = useState<ComposeMode>("broadcast");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sent notifications state
  const [sentNotifications, setSentNotifications] = useState<Record<string, unknown>[]>([]);
  const [sentLoading, setSentLoading] = useState(false);
  const [sentError, setSentError] = useState<string | null>(null);
  const [sentFilters, setSentFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
  });

  const { register: registerBroadcast, handleSubmit: handleSubmitBroadcast, reset: resetBroadcast, formState: { errors: errorsBroadcast } } = useForm<BroadcastFormData>();
  const { register: registerTargeted, handleSubmit: handleSubmitTargeted, reset: resetTargeted, formState: { errors: errorsTargeted } } = useForm<TargetedFormData>();

  const handleBroadcast = async (data: BroadcastFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await broadcastNotification(data.title, data.body);
      setSuccessMessage(response.message || "Notification broadcast successfully");
      resetBroadcast();
    } catch (err) {
      console.error("Error broadcasting notification:", err);
      setError(err instanceof Error ? err.message : "Failed to broadcast notification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTargeted = async (data: TargetedFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const emailList = data.emails.split(",").map(e => e.trim()).filter(Boolean);
      if (emailList.length === 0) {
        setError("Please provide at least one email address");
        return;
      }

      const response = await sendNotification(emailList, data.title, data.body);
      setSuccessMessage(response.message || `Notification sent to ${emailList.length} recipient(s)`);
      resetTargeted();
    } catch (err) {
      console.error("Error sending notification:", err);
      setError(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadSent = async () => {
    try {
      setSentLoading(true);
      setSentError(null);
      
      const params: Record<string, string> = {};
      if (sentFilters.type) params.type = sentFilters.type;
      if (sentFilters.startDate) params.startDate = sentFilters.startDate;
      if (sentFilters.endDate) params.endDate = sentFilters.endDate;
      
      const data = await getSentNotifications(params);
      console.log("Sent notifications:", data);
      
      setSentNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading sent notifications:", err);
      setSentError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setSentLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Notifications</h1>
        <p className="text-muted-foreground mt-1">Broadcast or send targeted notifications to users</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("compose")}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "compose"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Send size={16} />
            Compose
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab("sent");
            handleLoadSent();
          }}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "sent"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Bell size={16} />
            Sent
          </div>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-600 flex items-start gap-3">
          <CheckCircle size={20} className="shrink-0 mt-0.5" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === "compose" && (
        <div className="bg-card border border-border rounded-2xl p-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setComposeMode("broadcast")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                composeMode === "broadcast"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Broadcast to All
            </button>
            <button
              onClick={() => setComposeMode("targeted")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                composeMode === "targeted"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Send to Specific Users
            </button>
          </div>

          {/* Broadcast Form */}
          {composeMode === "broadcast" && (
            <form onSubmit={handleSubmitBroadcast(handleBroadcast)} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  {...registerBroadcast("title", { required: "Title is required" })}
                  placeholder="New Feature Available"
                />
                {errorsBroadcast.title && <p className="text-destructive text-sm mt-1">{errorsBroadcast.title.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message Body</label>
                <textarea
                  {...registerBroadcast("body", { required: "Message body is required" })}
                  placeholder="Check out our latest update..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[120px]"
                />
                {errorsBroadcast.body && <p className="text-destructive text-sm mt-1">{errorsBroadcast.body.message}</p>}
              </div>
              <Button type="submit" variant="gradient" className="w-full justify-center gap-2" disabled={submitting}>
                <Send size={16} />
                {submitting ? "Broadcasting..." : "Broadcast to All Users"}
              </Button>
            </form>
          )}

          {/* Targeted Form */}
          {composeMode === "targeted" && (
            <form onSubmit={handleSubmitTargeted(handleTargeted)} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email Addresses (comma-separated)</label>
                <textarea
                  {...registerTargeted("emails", { required: "At least one email is required" })}
                  placeholder="user1@example.com, user2@example.com"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[80px]"
                />
                {errorsTargeted.emails && <p className="text-destructive text-sm mt-1">{errorsTargeted.emails.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  {...registerTargeted("title", { required: "Title is required" })}
                  placeholder="Important Update"
                />
                {errorsTargeted.title && <p className="text-destructive text-sm mt-1">{errorsTargeted.title.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message Body</label>
                <textarea
                  {...registerTargeted("body", { required: "Message body is required" })}
                  placeholder="Your message here..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl min-h-[120px]"
                />
                {errorsTargeted.body && <p className="text-destructive text-sm mt-1">{errorsTargeted.body.message}</p>}
              </div>
              <Button type="submit" variant="gradient" className="w-full justify-center gap-2" disabled={submitting}>
                <Send size={16} />
                {submitting ? "Sending..." : "Send to Selected Users"}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Sent Tab */}
      {activeTab === "sent" && (
        <>
          {/* Error Message */}
          {sentError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive">
              {sentError}
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <select
                  value={sentFilters.type}
                  onChange={(e) => setSentFilters({ ...sentFilters, type: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl"
                >
                  <option value="">All</option>
                  <option value="broadcast">Broadcast</option>
                  <option value="targeted">Targeted</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={sentFilters.startDate}
                  onChange={(e) => setSentFilters({ ...sentFilters, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={sentFilters.endDate}
                  onChange={(e) => setSentFilters({ ...sentFilters, endDate: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleLoadSent} disabled={sentLoading} variant="gradient" className="w-full">
                  {sentLoading ? "Loading..." : "Load Notifications"}
                </Button>
              </div>
            </div>
          </div>

          {/* Sent Notifications List */}
          {/* TODO(tartor): Generic render until response shape confirmed */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6">Sent Notifications</h2>
            {sentNotifications.length > 0 ? (
              <div className="space-y-4">
                {sentNotifications.map((notif, idx) => (
                  <div key={idx} className="p-4 bg-secondary/30 rounded-xl">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(notif).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="font-medium">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {sentLoading ? "Loading..." : "No sent notifications yet. Use filters above to load data."}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
