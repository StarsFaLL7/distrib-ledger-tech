import { useState } from "react";
import { type Address, parseEther, parseUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

const chainId = 31337;
const escrowContractInfo = deployedContracts[chainId].Escrow;
const TUSDTContractInfo = deployedContracts[chainId].TUSDT;

export const CreateDeal = () => {
  const { isConnected } = useAccount();
  const { writeContractAsync, isPending, error } = useWriteContract();

  const [seller, setSeller] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [amountEth, setAmountEth] = useState("");
  const [deadline, setDeadline] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState("ETH");

  const toUnixTimestamp = (dateStr: string) => Math.floor(new Date(dateStr).getTime() / 1000);

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  const ShowError = (error: any) => {
    let message = "Неизвестная ошибка";
    if (error?.reason) {
      message = error.reason;
    } else if (error?.data?.message) {
      message = error.data.message;
    } else if (error?.error?.message) {
      message = error.error.message;
    } else if (error?.message) {
      const revertMatch = error.message.match(/revert (.*)/);
      if (revertMatch) {
        message = revertMatch[1];
      } else {
        message = error.message;
      }
    }

    alert(`Ошибка транзакции: ${message}`);
    console.error(error);
  };

  const handleCreateDeal = async () => {
    if (!isConnected) return alert("Сначала подключите кошелёк");
    if (!seller || !arbiter || !amountEth || !deadline) return alert("Пожалуйста, заполните все поля");
    if (!isValidAddress(seller) || !isValidAddress(arbiter)) return alert("Один из адресов некорректен");
    if (selectedToken === "ETH") {
      try {
        const hash = await writeContractAsync({
          address: escrowContractInfo.address,
          abi: escrowContractInfo.abi,
          functionName: "createDealEth",
          args: [seller as Address, arbiter as Address, BigInt(toUnixTimestamp(deadline))],
          value: parseEther(amountEth),
          chainId: chainId,
        });
        setTxHash(hash);
        alert("Сделка создана! Транзакция отправлена.");
      } catch (err) {
        ShowError(err);
      }
    } else {
      try {
        const amountParsed = parseUnits(amountEth.toString(), 8);
        await writeContractAsync({
          address: TUSDTContractInfo.address,
          abi: TUSDTContractInfo.abi,
          functionName: "approve",
          args: [escrowContractInfo.address, amountParsed],
          chainId,
        });
        const hash = await writeContractAsync({
          address: escrowContractInfo.address,
          abi: escrowContractInfo.abi,
          functionName: "createDeal",
          args: [
            seller as Address,
            arbiter as Address,
            amountParsed,
            BigInt(toUnixTimestamp(deadline)),
            TUSDTContractInfo.address as Address,
          ],
          chainId: chainId,
        });
        setTxHash(hash);
        alert("Сделка создана! Транзакция отправлена.");
      } catch (err) {
        ShowError(err);
        await writeContractAsync({
          address: TUSDTContractInfo.address,
          abi: TUSDTContractInfo.abi,
          functionName: "approve",
          args: [escrowContractInfo.address, BigInt(0)],
          chainId,
        });
      }
    }
  };

  return (
    <div className="card w-96 bg-base-100 card-md shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Создать сделку</h2>
        <fieldset className="fieldset rounded-box w-xs">
          <label className="label">Адрес продавца</label>
          <input
            type="text"
            className="input"
            value={seller}
            onChange={e => setSeller(e.target.value)}
            placeholder="0x7099..."
          />
          <label className="label">Адрес арбитра</label>
          <input
            type="text"
            className="input"
            value={arbiter}
            onChange={e => setArbiter(e.target.value)}
            placeholder="0x3C44..."
          />
          <label className="label">Сумма ({selectedToken})</label>
          <input
            type="number"
            min="0"
            step="0.001"
            className="input"
            value={amountEth}
            onChange={e => setAmountEth(e.target.value)}
            placeholder="0.01"
          />
          <div>
            <label className="label">Валюта</label>
            <select className="select" value={selectedToken} onChange={e => setSelectedToken(e.target.value)}>
              <option disabled={true} value="">
                Выберите валюту
              </option>
              <option value="ETH">ETH</option>
              <option value="TUSDT">TUSDT</option>
            </select>
          </div>
          <label className="label">Срок (дата и время)</label>
          <input type="datetime-local" className="input" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </fieldset>
        <div className="justify-end card-actions mt-4">
          <button
            className={`btn btn-primary ${isPending ? "loading" : ""}`}
            onClick={handleCreateDeal}
            disabled={isPending}
          >
            {isPending ? "Создание..." : "Создать"}
          </button>
        </div>
        {txHash && (
          <p className="mt-2 text-xs text-green-500">
            Транзакция отправлена: <br />
            <a
              href={`http://localhost:3000/blockexplorer/transaction/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {txHash.slice(0, 10)}...
            </a>
          </p>
        )}
        {error && <p className="text-red-500 mt-2 text-sm">Ошибка: {error.message}</p>}
      </div>
    </div>
  );
};
