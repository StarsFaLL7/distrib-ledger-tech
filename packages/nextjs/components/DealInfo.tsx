import { useState } from "react";
import { wagmiConfig } from "../services/web3/wagmiConfig";
import { readContract } from "@wagmi/core";
import { formatEther, formatUnits } from "viem";
import { useAccount } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

const escrowContractInfo = deployedContracts[31337].Escrow;

export const DealInfo = () => {
  const { address } = useAccount();
  const [dealIdInput, setDealIdInput] = useState<string>("");
  const dealId: bigint = dealIdInput ? BigInt(dealIdInput) : 0n;
  const [dealInfo, setDeal] = useState<any>();
  const [loading, setLoading] = useState(false);

  const loadDealInfo = async () => {
    if (!address) {
      return alert("Сначала подключите кошелёк");
    }

    setLoading(true);
    try {
      const deal = await readContract(wagmiConfig, {
        abi: escrowContractInfo.abi,
        address: escrowContractInfo.address,
        functionName: "getDealInfo",
        args: [dealId],
      });
      setDeal({
        id: dealId,
        buyer: deal[0],
        seller: deal[1],
        arbiter: deal[2],
        amount: deal[3],
        symbol: deal[4],
        deadline: deal[5],
        buyerApproved: deal[6],
        sellerApproved: deal[7],
        resolved: deal[8],
      });
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке сделки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-3xl bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">Информация о конкретной сделке</h2>
        <label className="label">Id сделки</label>
        <input
          type="number"
          min="0"
          step="1"
          className="input"
          value={dealIdInput}
          onChange={e => {
            const val = e.target.value;
            if (/^\d*$/.test(val)) {
              setDealIdInput(val);
            }
          }}
          placeholder="1"
        />
        <button className="btn btn-primary mb-4" onClick={loadDealInfo} disabled={loading}>
          {loading ? "Загрузка..." : "Обновить"}
        </button>

        {dealInfo === null && !loading && <p>Нет информации для отображения.</p>}

        {dealInfo !== undefined && (
          <div key={dealInfo.id} className="border-t pt-3 mt-3">
            <p>
              <strong>ID:</strong> {dealInfo.id}
            </p>
            <p>
              <strong>Покупатель:</strong> {dealInfo.buyer}
            </p>
            <p>
              <strong>Продавец:</strong> {dealInfo.seller}
            </p>
            <p>
              <strong>Арбитр:</strong> {dealInfo.arbiter}
            </p>
            <p>
              <strong>Сумма:</strong>{" "}
              {dealInfo.symbol === "ETH" ? formatEther(dealInfo.amount) : formatUnits(dealInfo.amount, 8)}{" "}
              {dealInfo.symbol}
            </p>
            <p>
              <strong>Срок:</strong> {new Date(Number(dealInfo.deadline) * 1000).toLocaleString()}
            </p>
            <p>
              <strong>Покупатель подтвердил:</strong> {dealInfo.buyerApproved ? "Да" : "Нет"}
            </p>
            <p>
              <strong>Продавец подтвердил:</strong> {dealInfo.sellerApproved ? "Да" : "Нет"}
            </p>
            <p>
              <strong>Завершено:</strong> {dealInfo.resolved ? "Да" : "Нет"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
