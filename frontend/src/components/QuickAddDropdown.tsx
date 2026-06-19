import { useRef, useState } from "react";
import { Button, Divider, Input, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface Props {
  menu: React.ReactElement;
  placeholder?: string;
  loading?: boolean;
  onAdd: (value: string) => void;
}

export default function QuickAddDropdown({ menu, placeholder = "Nouveau…", loading, onAdd }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<any>(null);

  return (
    <>
      {menu}
      <Divider style={{ margin: "6px 0" }} />
      <Space.Compact style={{ padding: "0 8px 6px", width: "100%" }}>
        <Input
          ref={inputRef}
          size="small"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && value.trim()) {
              onAdd(value.trim());
              setValue("");
            }
          }}
        />
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          loading={loading}
          disabled={!value.trim()}
          onClick={() => {
            onAdd(value.trim());
            setValue("");
          }}
        />
      </Space.Compact>
    </>
  );
}
