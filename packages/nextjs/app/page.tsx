"use client";

import { CreateDeal } from "../components/CreateDeal";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ArbiterPanel } from "~~/components/ArbiterPanel";
import { DealInfo } from "~~/components/DealInfo";
import { MyDeals } from "~~/components/MyDeals";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Escrow contract</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <p className="text-center text-lg">
            Смарт-контракт для протекции сделки с криптовалютой (ETH или IERC20 токены) третьей стороной.
          </p>
          <p>Логика:</p>
          <ol className="list-decimal">
            <li>
              Покупатель создаёт сделку через <code>createDeal()</code> или <code>createDealEth()</code>, указывая
              продавца, арбитра, сумму и срок сделки;
            </li>
            <li>
              Криптовалюта поступает на смарт-контракт, где также создаётся сделка, ожидающая подтверждения обеих
              сторон;
            </li>
            <li>
              Покупатель и Продавец могут подтвердить сделку через <code>approveDeal()</code>, указав id сделки;
            </li>
            <li>
              Если сделка подтверждена с обеих сторон, продавец может вывести криптовалюту через{" "}
              <code>withdrawFunds();</code>
            </li>
            <li>
              Если возник конфликт, арбитр может закончить сделку через <code>resolveDispute()</code> в пользу любого
              участника с переводом криптовалюты на его счёт;
            </li>
            <li>
              Если срок сделки истёк, но подтверждение от обеих сторон не поступило, только арбитр может её завершить.
            </li>
          </ol>
        </div>
        <div className="max-w-7xl mx-auto px-4 m-5">
          <div className="flex flex-wrap gap-4">
            <div>
              <CreateDeal />
            </div>
            <div>
              <MyDeals />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <ArbiterPanel />
            </div>
            <div>
              <DealInfo />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
