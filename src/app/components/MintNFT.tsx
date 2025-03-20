"use client";

import { useState } from "react";
import { Button, Input, Card, Form, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export default function MintNFT() {
  const [nftName, setNftName] = useState("");
  const [nftImage, setNftImage] = useState<File | null>(null);

  const handleMintNFT = () => {
    if (!nftName || !nftImage) {
      message.error("Vui lòng nhập tên NFT và chọn ảnh!");
      return;
    }

    message.success(`Minting NFT: ${nftName}...`);
    // Gọi hàm mint NFT trên smart contract ở đây
  };

  return (
    <Card title="Mint ERC721 NFT" style={{ width: 400 }}>
      <Form>
        <Form.Item label="NFT Name">
          <Input value={nftName} onChange={(e) => setNftName(e.target.value)} />
        </Form.Item>
        <Form.Item label="Upload Image">
          <Upload beforeUpload={(file) => { setNftImage(file); return false; }}>
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </Form.Item>
        <Button type="primary" onClick={handleMintNFT}>Mint NFT</Button>
      </Form>
    </Card>
  );
}
