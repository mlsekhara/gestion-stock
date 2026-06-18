import { Card, Empty, Typography } from "antd";
import { ToolOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export default function ModuleEnConstruction({ titre }: { titre: string }) {
  const { t } = useTranslation();
  return (
    <Card variant="borderless">
      <Typography.Title level={3}>{titre}</Typography.Title>
      <Empty
        image={<ToolOutlined style={{ fontSize: 64, color: "#bfbfbf" }} />}
        description={
          <Typography.Text type="secondary">
            {t("commun.enConstruction")} — {t("commun.enConstructionDetail")}
          </Typography.Text>
        }
      />
    </Card>
  );
}
