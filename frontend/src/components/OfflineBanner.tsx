import { useEffect, useState } from "react";
import { Alert, Badge, Space } from "antd";
import { WifiOutlined, CloudSyncOutlined } from "@ant-design/icons";
import { useSyncQueue } from "@/offline/syncQueue";

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const pendingCount = useSyncQueue((s) => s.queue.length);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (online && pendingCount > 0) {
      useSyncQueue.getState().flush();
    }
  }, [online, pendingCount]);

  if (online && pendingCount === 0) return null;

  if (!online) {
    return (
      <Alert
        type="warning"
        banner
        showIcon
        icon={<WifiOutlined />}
        message={
          <Space>
            Mode hors-ligne — Les données sont sauvegardées localement
            {pendingCount > 0 && <Badge count={pendingCount} style={{ backgroundColor: "#fa8c16" }} />}
          </Space>
        }
      />
    );
  }

  return (
    <Alert
      type="info"
      banner
      showIcon
      icon={<CloudSyncOutlined spin />}
      message={`Synchronisation en cours… ${pendingCount} opération(s) en attente`}
    />
  );
}
