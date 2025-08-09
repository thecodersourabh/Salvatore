interface CategoryCardProps {
  title: string;
  image: string;
  icon: React.ReactNode;
}

export const CategoryCard = ({ title, image, icon }: CategoryCardProps) => {
  return (
    <div className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0 z-10" />
      <img
        src={image}
        alt={title}
        className="w-full h-[300px] object-cover group-hover:scale-105 transition duration-300"
      />
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <div className="flex items-center space-x-2 text-white">
          <div className="bg-rose-600 p-2 rounded-full">{icon}</div>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
      </div>
    </div>
  );
};
