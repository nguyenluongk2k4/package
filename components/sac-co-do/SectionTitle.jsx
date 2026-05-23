export default function SectionTitle({ eyebrow, title, highlight, description, align = "center" }) {
  const alignment = align === "left" ? "text-left" : "text-center max-w-150 mx-auto";

  return (
    <div className={`${alignment} md:mb-15 mb-7.5`}>
      {eyebrow ? (
        <span className="text-citrusyellow font-title text-lg font-bold uppercase mb-2 block">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="sac-section-heading xl:text-46 md:text-40 text-3xl mb-2.5">
        {highlight ? <span className="text-citrusyellow">{highlight} </span> : null}
        {title}
      </h2>
      {description ? <p className="text-base">{description}</p> : null}
      <div className="-mt-7">
        <img
          src="/assets/images/background/Title-Separator.png"
          alt=""
          className="w-117.5 inline-block"
          width="470"
          height="70"
          loading="lazy"
        />
      </div>
    </div>
  );
}
