"use client";

import { useState, useEffect } from "react";
import { Button, Input, Card, Form, Upload, message, Modal, List } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useWriteContract, useReadContract, useAccount } from "wagmi";

// Thông tin contract NFT
const NFT_ADDRESS = "0x51cF18645C179A7d86b67980463c96c3D0227291";
const NFT_ABI = [
  {
    "inputs": [{ "internalType": "string", "name": "tokenURI", "type": "string" }],
    "name": "mintNFT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "getNFTsByOwner",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" },
      { "internalType": "string[]", "name": "", "type": "string[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// API Key Pinata
const PINATA_API_KEY = "3fafe823b2c056f2254f";
const PINATA_SECRET_KEY = "aed6ef2a34cb96578ba716e89651b72809b88b9f8db133859345c631c874254b"; // Không để secret key trong client

export default function MintNFT() {
  const [nftName, setNftName] = useState("");
  const [nftImage, setNftImage] = useState<File | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);
  const [nftList, setNftList] = useState<{ id: number; uri: string }[]>([]);

  const { address } = useAccount(); // Lấy địa chỉ ví của user
  const { writeContractAsync } = useWriteContract();
  const { data: userNFTs, refetch } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: "getNFTsByOwner",
    args: [address],
    // enabled: !!address // Chỉ fetch nếu user đã kết nối ví
  });

  useEffect(() => {
    if (userNFTs) {
      const [ids, uris] = userNFTs as [bigint[], string[]];
      setNftList(ids.map((id, index) => ({ id: Number(id), uri: uris[index] })));
    }
  }, [userNFTs]);

  // Upload ảnh lên IPFS thông qua Pinata
  const uploadToPinata = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          "pinata_api_key": PINATA_API_KEY,
          "pinata_secret_api_key": PINATA_SECRET_KEY
        },
        body: formData
      });

      const data = await res.json();
      return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
    } catch (error) {
      console.error("Upload to Pinata failed:", error);
      message.error("Failed to upload image to IPFS.");
      return null;
    }
  };

  const handleMintNFT = async () => {
    if (!nftName || !nftImage) {
      message.error("Vui lòng nhập tên NFT và chọn ảnh!");
      return;
    }

    if (!address) {
      message.error("Vui lòng kết nối ví trước khi mint!");
      return;
    }

    try {
      setIsMinting(true);
      message.loading({ content: "Uploading to IPFS...", key: "uploading", duration: 0 });

      // Upload ảnh lên IPFS
      const imageUrl = await uploadToPinata(nftImage);
      if (!imageUrl) throw new Error("IPFS upload failed");

      message.destroy("uploading");
      message.loading({ content: "Minting NFT...", key: "minting", duration: 0 });

      // Mint NFT trên blockchain
      const tx = await writeContractAsync({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: "mintNFT",
        args: [imageUrl]
      });
      console.log("Transaction sent, hash:", tx);
      const tokenId = typeof tx === 'string' ? parseInt(tx, 10) : tx; // Convert tx to number if it's a string
      setMintedTokenId(tokenId);

      message.destroy("minting");
      setIsSuccessModalVisible(true);
      setNftName("");
      setNftImage(null);
      refetch(); // Cập nhật danh sách NFT sau khi mint
    } catch (error) {
      console.error("Minting failed:", error);
      message.destroy("minting");
      message.error("Giao dịch thất bại!");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <Card title="Mint ERC721 NFT" style={{ width: 600 }}>
      <Form>
        <Form.Item label="NFT Name">
          <Input value={nftName} onChange={(e) => setNftName(e.target.value)} />
        </Form.Item>
        <Form.Item label="Upload Image">
          <Upload beforeUpload={(file) => { setNftImage(file); return false; }}>
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </Form.Item>
        <Button type="primary" onClick={handleMintNFT} loading={isMinting}>
          Mint NFT
        </Button>
      </Form>

      {/* Modal hiển thị sau khi mint thành công */}
      <Modal
        title="Mint Success!"
        open={isSuccessModalVisible}
        onOk={() => setIsSuccessModalVisible(false)}
        onCancel={() => setIsSuccessModalVisible(false)}
      >
        <p>Bạn đã mint NFT thành công! 🎉</p>
        <p>Token ID: {mintedTokenId}</p>
      </Modal>

      {/* Danh sách NFT đã mint */}
      <Card title="Your NFTs" style={{ marginTop: 20 }}>
        {nftList.length === 0 ? (
          <p>No NFTs found.</p>
        ) : (
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={nftList}
            renderItem={(item) => (
              <List.Item>
                <Card cover={<img src={item.uri} alt={`NFT ${item.id}`} />} style={{ textAlign: "center" }}>
                  <p>Token ID: {item.id}</p>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Card>
  );
}
