export default function MinadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#060608] text-white min-h-screen">
      {children}
    </div>
  );
}
