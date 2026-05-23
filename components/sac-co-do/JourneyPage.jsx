import Link from "next/link";
import { stations } from "../../data/sac-co-do";
import SectionTitle from "./SectionTitle";
import StationCard from "./StationCard";
import TemplateFrame from "./TemplateFrame";

export default function JourneyPage() {
  return (
    <TemplateFrame>
      <InnerBanner />
      <JourneyMapSection />
      <DestinationGridSection />
    </TemplateFrame>
  );
}

function InnerBanner() {
  return (
    <div className="relative bg-cover bg-center w-full bg-white bg-[url(../images/background/inr-banner.jpg)] overflow-hidden sac-inner-banner">
      <div className="flex w-full lg:h-160 md:h-135 h-100 pb-10 items-baseline mx-auto">
        <div className="relative md:mt-60 mt-45 flex items-center justify-center w-full flex-col z-5">
          <div>
            <h1 className="lg:text-60 md:text-52 text-28 relative">Hành trình Sắc Cố Đô</h1>
          </div>
          <div>
            <ul className="inline-block">
              <li className="text-base pr-7.5 relative inline-block font-semibold text-primary after:content-['-'] after:absolute after:right-2 after:-top-1.5 after:text-primary after:text-26 after:font-normal">
                <Link href="/">Trang chủ</Link>
              </li>
              <li className="relative inline-block text-base font-semibold text-primary">6 trạm trải nghiệm</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="h-50 w-full absolute top-50 left-0 z-1">
        <div className="inline-block whitespace-nowrap animate-moveCloud">
          <img src="/assets/images/inr-banner-cloud.png" alt="" className="h-47.5" />
        </div>
      </div>
      <div className="absolute w-1/2 right-0 top-0 bottom-0 z-1">
        <div className="mt-60 animate-slide-right">
          <img src="/assets/images/airplane.png" alt="" className="animate-slide-top-fast" width="378" height="146" />
        </div>
      </div>
      <div className="absolute right-11.25 bottom-16.25 animate-slide-top2">
        <img src="/assets/images/hotballon-Left.png" alt="" className="md:w-21 w-10" width="84" height="121" />
      </div>
      <div className="absolute md:-right-15 -right-10 top-41.25 animate-slide-top">
        <img src="/assets/images/hotballon-right.png" alt="" className="md:w-37.5 w-20" width="230" height="333" />
      </div>
    </div>
  );
}

function JourneyMapSection() {
  return (
    <section className="bg-white md:pt-30 pt-17.5 md:pb-10 pb-5">
      <div className="container">
        <SectionTitle
          highlight="Bản đồ"
          title="hành trình 6 dấu"
          description="Tạm thời dùng map minh họa tĩnh để đúng tinh thần MVP: nhẹ, nhanh, không cần Google Maps API."
        />
        <div className="sac-map">
          {stations.map((station, index) => (
            <Link
              href={`/hanh-trinh#${station.id}`}
              className={`sac-map-pin sac-map-pin-${index + 1}`}
              key={station.id}
            >
              <span>{index + 1}</span>
              <strong>{station.name}</strong>
            </Link>
          ))}
          <div className="sac-map-route" />
        </div>
      </div>
    </section>
  );
}

function DestinationGridSection() {
  return (
    <section className="bg-contain bg-[bottom_center] bg-repeat-x xl:pb-22.5 xl:pt-20 pt-12.5">
      <div className="container">
        <div className="grid grid-cols-12 gap-7.5">
          {stations.map((station) => (
            <StationCard station={station} key={station.id} />
          ))}
        </div>
        <div className="sac-journey-note">
          <div>
            <h3>Luồng sau bước này</h3>
            <p>
              Khi có Firebase, mỗi card sẽ biết trạng thái đã check-in/chưa check-in theo ID người dùng.
            </p>
          </div>
          <Link href="/kich-hoat" className="site-button butn-bg-shape">
            Kích hoạt ID
          </Link>
        </div>
      </div>
    </section>
  );
}
