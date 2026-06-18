import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Alert, Modal, Space, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  onResult: (code: string) => void;
}

/**
 * Scanner caméra réutilisable (codes-barres EAN/UPC, QR, IMEI imprimé en code-barres).
 * Utilisé pour les entrées de stock, l'inventaire et les ventes.
 */
export default function CameraScanner({ open, onClose, onResult }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let actif = true;
    const reader = new BrowserMultiFormatReader();
    setErreur(null);

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
        controlsRef.current = controls;
        if (result && actif) {
          controls.stop();
          onResult(result.getText());
          onClose();
        }
      })
      .catch(() => actif && setErreur(t("scanner.erreurCamera")));

    return () => {
      actif = false;
      controlsRef.current?.stop();
    };
  }, [open, onClose, onResult, t]);

  return (
    <Modal title={t("scanner.titre")} open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {erreur ? (
          <Alert type="error" message={t("scanner.autorisation")} description={erreur} showIcon />
        ) : (
          <>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 3",
                background: "#000",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div
                style={{
                  position: "absolute",
                  inset: "25% 12%",
                  border: "2px solid #13c2c2",
                  borderRadius: 8,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.25)",
                }}
              />
            </div>
            <Typography.Text type="secondary">{t("scanner.instruction")}</Typography.Text>
          </>
        )}
      </Space>
    </Modal>
  );
}
