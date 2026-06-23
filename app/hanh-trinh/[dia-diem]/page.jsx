import JourneyDetailPage from "../../../components/sac-co-do/JourneyDetailPage";
import { stations } from "../../../data/sac-co-do";

const stationMetadata = {
  "trang-an": {
    name: "Tràng An",
    description: "Không gian di sản với núi đá vôi và dòng nước xanh, trạm mở đầu hành trình Sắc Cố Đô.",
  },
  "hoa-lu": {
    name: "Cố Đô Hoa Lư",
    description: "Dấu mốc lịch sử của vùng đất cố đô — tìm QR tại cổng thành để bắt đầu check-in.",
  },
  "bai-dinh": {
    name: "Chùa Bái Đính",
    description: "Một trạm lắng và rộng — QR nằm trong hành lang La Hán, gần lối tháp chuông.",
  },
  "pho-co-hoa-lu": {
    name: "Phố Cổ Hoa Lư",
    description: "Sắc đèn, mái ngói và nhịp dạo chơi chậm rãi — QR trên lan can cầu Kỳ Lân.",
  },
  "tam-coc": {
    name: "Tam Cốc - Bích Động",
    description: "Lát cắt mềm mại của Ninh Bình — QR bên cây cổ thụ ở bến Văn Lâm.",
  },
  "hang-mua": {
    name: "Hang Múa",
    description: "Trạm kết với góc nhìn toàn cảnh — QR tại cột gỗ đầu lối leo núi.",
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
    title: `${station.name} — Tìm QR & Check-in | Hành trình Sắc Cố Đô`,
    description: station.description,
  };
}

export default async function Page({ params }) {
  const { "dia-diem": stationId } = await params;
  const station = stations.find((item) => item.id === stationId || item.slug === stationId) || stations[0];

  return <JourneyDetailPage station={station} stationId={stationId} />;
}
