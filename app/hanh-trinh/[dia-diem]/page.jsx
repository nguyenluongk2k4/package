import JourneyDetailPage from "../../../components/sac-co-do/JourneyDetailPage";
import { stations } from "../../../data/sac-co-do";

const stationMetadata = {
  "trang-an": {
    name: "Tràng An",
    description: "Không gian di sản với núi đá vôi và dòng nước xanh, phù hợp làm trạm mở đầu của hành trình.",
  },
  "hoa-lu": {
    name: "Cố Đô Hoa Lư",
    description: "Dấu mốc lịch sử của vùng đất cố đô, nơi cuốn passport bắt đầu kể chuyện bằng ký ức triều đại.",
  },
  "bai-dinh": {
    name: "Chùa Bái Đính",
    description: "Một trạm lắng và rộng, dành cho trải nghiệm đóng dấu sau khi đi qua hành lang văn hóa tâm linh.",
  },
  "pho-co-hoa-lu": {
    name: "Phố Cổ Hoa Lư",
    description: "Sắc đèn, mái ngói và nhịp dạo chơi chậm rãi, phù hợp cho check-in và photobooth kỷ niệm.",
  },
  "tam-coc": {
    name: "Tam Cốc - Bích Động",
    description: "Một lát cắt mềm mại của Ninh Bình, nơi trải nghiệm giấy pop-up gặp cảnh quan ngoài đời.",
  },
  "hang-mua": {
    name: "Hang Múa",
    description: "Trạm kết giàu năng lượng với góc nhìn toàn cảnh, mở khóa phần thưởng sau khi hoàn thành hành trình.",
  },
};

export function generateStaticParams() {
  return stations.map((station) => ({
    "dia-diem": station.id,
  }));
}

export async function generateMetadata({ params }) {
  const { "dia-diem": stationId } = await params;
  const station = stationMetadata[stationId] || stations.find((item) => item.id === stationId || item.slug === stationId);

  if (!station) {
    return {
      title: "Hành trình | Sắc Cố Đô",
    };
  }

  return {
    title: `${station.name} | Hành trình Sắc Cố Đô`,
    description: station.description,
  };
}

export default async function Page({ params }) {
  const { "dia-diem": stationId } = await params;
  const station = stations.find((item) => item.id === stationId || item.slug === stationId) || stations[0];

  return <JourneyDetailPage station={station} stationId={stationId} />;
}
