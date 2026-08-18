"use client";

import Link from "next/link";
import { useSheet } from "@/lib/overlay/OverlayProvider";

export function HelpSheet() {
  const { close } = useSheet();

  return (
    <>
      <h3>한끼는 이렇게 써요</h3>
      <div className="card flat">
        <p className="desc" style={{ margin: 0 }}>
          <b>오늘 뭐 먹지?</b>에서 지금 갈 수 있는 급식카드 가맹점을 찾고,
          <br />
          <b>잔액 입력하기</b>에서 남은 금액을 직접 적어두면 하루에 얼마씩 쓰면 좋을지
          계산해드려요.
        </p>
      </div>
      <div className="card flat">
        <p className="desc" style={{ margin: 0 }}>
          가게 정보와 메뉴 가격은 달라질 수 있어요. 방문 전에 가게에 확인하고, 카드 결제가
          안 됐다면 상세 화면 아래에서 알려주세요.
        </p>
      </div>
      <Link className="btn" href="/chat" onClick={close}>
        한끼 도우미에게 물어보기
      </Link>
    </>
  );
}
