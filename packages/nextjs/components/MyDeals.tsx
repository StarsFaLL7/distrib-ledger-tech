import { useState } from "react";
import { wagmiConfig } from "../services/web3/wagmiConfig";
import { readContract } from "@wagmi/core";
import { formatEther, formatUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

const chainId = 31337;
const escrowContractInfo = deployedContracts[chainId].Escrow;

export const MyDeals = () => {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  const isDealExpired = (deal: any) => Date.now() > Number(deal.deadline) * 1000;

  const loadDeals = async () => {
    if (!address) {
      return alert("Сначала подключите кошелёк");
    }

    setLoading(true);
    try {
      const dealIds = await readContract(wagmiConfig, {
        abi: escrowContractInfo.abi,
        address: escrowContractInfo.address,
        functionName: "getUserDeals",
        args: [address],
      });

      const dealsInfo = await Promise.all(
        dealIds.map(async id => {
          const deal = await readContract(wagmiConfig, {
            address: escrowContractInfo.address,
            abi: escrowContractInfo.abi,
            functionName: "getDealInfo",
            args: [id],
          });
          return {
            id,
            buyer: deal[0],
            seller: deal[1],
            arbiter: deal[2],
            amount: deal[3],
            symbol: deal[4],
            deadline: deal[5],
            buyerApproved: deal[6],
            sellerApproved: deal[7],
            resolved: deal[8],
          };
        }),
      );
      console.log(dealsInfo);
      setDeals(dealsInfo);
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке сделок");
    } finally {
      setLoading(false);
    }
  };

  const ApproveDeal = async (dealId: bigint) => {
    try {
      await writeContractAsync({
        address: escrowContractInfo.address,
        abi: escrowContractInfo.abi,
        functionName: "approveDeal",
        args: [dealId],
        chainId: chainId,
      });
      alert("Сделка подтверждена.");
      await loadDeals();
    } catch (err) {
      console.error(err);
    }
  };

  const WidthrawFunds = async (dealId: bigint) => {
    try {
      await writeContractAsync({
        address: escrowContractInfo.address,
        abi: escrowContractInfo.abi,
        functionName: "withdrawFunds",
        args: [dealId],
        chainId: chainId,
      });
      alert("Сделка завершена. Средства выведены.");
      await loadDeals();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card w-full max-w-3xl bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">Мои сделки</h2>
        <label className="flex items-center gap-2">
          <input
            className="checkbox"
            type="checkbox"
            checked={showFinished}
            onChange={e => setShowFinished(e.target.checked)}
          />
          Показывать завершенные
        </label>
        <button className="btn btn-primary mb-4" onClick={loadDeals} disabled={loading}>
          {loading ? "Загрузка..." : "Обновить"}
        </button>

        {deals.length === 0 && !loading && <p>Нет сделок для отображения.</p>}

        {deals
          .filter(deal => showFinished || !deal.resolved)
          .map((deal, index) => (
            <div key={index} className="border-t pt-3 mt-3">
              <p>
                <strong>ID:</strong> {deal.id.toString()}
              </p>
              <p>
                <strong>Покупатель:</strong> {deal.buyer}
              </p>
              <p>
                <strong>Продавец:</strong> {deal.seller}
              </p>
              <p>
                <strong>Арбитр:</strong> {deal.arbiter}
              </p>
              <p>
                <strong>Сумма:</strong> {deal.symbol === "ETH" ? formatEther(deal.amount) : formatUnits(deal.amount, 8)}{" "}
                {deal.symbol}
              </p>
              <p>
                <strong>Срок:</strong> {new Date(Number(deal.deadline) * 1000).toLocaleString()}
              </p>
              <p>
                <strong>Покупатель подтвердил:</strong> {deal.buyerApproved ? "Да" : "Нет"}
              </p>
              <p>
                <strong>Продавец подтвердил:</strong> {deal.sellerApproved ? "Да" : "Нет"}
              </p>
              <p>
                <strong>Завершено:</strong> {deal.resolved ? "Да" : "Нет"}
              </p>

              {isDealExpired(deal) && (!deal.buyerApproved || !deal.sellerApproved) && (
                <p className="text-red-500 mt-2 text-sm">
                  Срок сделки истёк. Обратитесь к арбитру для закрытия сделки.
                </p>
              )}

              {address?.toLowerCase() === deal.buyer.toLowerCase() && !deal.buyerApproved && !isDealExpired(deal) && (
                <button className="btn btn-primary mt-2" onClick={() => ApproveDeal(deal.id)}>
                  Подтвердить сделку
                </button>
              )}

              {address?.toLowerCase() === deal.seller.toLowerCase() && !deal.sellerApproved && !isDealExpired(deal) && (
                <button className="btn btn-primary mt-2" onClick={() => ApproveDeal(deal.id)}>
                  Подтвердить сделку
                </button>
              )}

              {address?.toLowerCase() === deal.seller.toLowerCase() &&
                deal.buyerApproved &&
                deal.sellerApproved &&
                !deal.resolved && (
                  <button className="btn btn-success mt-2" onClick={() => WidthrawFunds(deal.id)}>
                    Вывести средства
                  </button>
                )}
            </div>
          ))}
      </div>
    </div>
  );
};
