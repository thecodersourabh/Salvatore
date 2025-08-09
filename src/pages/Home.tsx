import { BedDouble, Ruler, Scissors, Sparkles } from "lucide-react";
import { CategoryCard } from "../components/CategoryCard";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  return (
    <>
      {/* Hero Section */}
      <div
        className="relative h-[500px] bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1528578950694-9f79b45a3397?auto=format&fit=crop&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">
              Design Your Dream Fabric
            </h1>
            <p className="text-xl mb-8">
              Turn your creativity into beautiful custom fabrics
            </p>
            <button
              onClick={() => navigate("/design")}
              className="bg-rose-600 text-white px-8 py-3 rounded-full hover:bg-rose-700 transition"
            >
              Start Designing
            </button>
          </div>
        </div>
      </div>

      {/* New Product Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-rose-100 text-rose-600 px-4 py-1 rounded-full text-sm font-semibold">
                NEW
              </div>
              <h2 className="text-4xl font-bold">
                Extra-Wide Cotton Sateen Fabrics
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                With 116" (over 9½ feet!) of printed width, these two 100%
                cotton fabrics are perfect for large scale projects like
                bedding, table linens and quilt backings. Now available by the
                yard featuring your choice of any Spoonflower print.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Ruler className="h-5 w-5" />
                  <span>116" Width</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Scissors className="h-5 w-5" />
                  <span>100% Cotton</span>
                </div>
              </div>
              <button
                onClick={() =>
                  addItem({
                    id: "cotton-sateen",
                    name: "Extra-Wide Cotton Sateen Fabric",
                    price: 24.99,
                    image:
                      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80",
                  })
                }
                className="bg-rose-600 text-white px-6 py-3 rounded-full hover:bg-rose-700 transition"
              >
                Shop Now
              </button>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80"
                alt="Extra-Wide Cotton Sateen Fabric"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">
          Featured Collections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CategoryCard
            title="Custom Bedding"
            image="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80"
            icon={<BedDouble className="h-6 w-6" />}
          />
          <CategoryCard
            title="Designer Prints"
            image="https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&q=80"
            icon={<Sparkles className="h-6 w-6" />}
          />
          <CategoryCard
            title="Seasonal Fabrics"
            image="https://images.unsplash.com/photo-1544365558-35aa4afcf11f?auto=format&fit=crop&q=80"
            icon={<Scissors className="h-6 w-6" />}
          />
        </div>
      </div>

      {/* Design Challenge Banner */}
      <div className="bg-gray py-12">
        <div className="max-w-7xl mx-auto px-4"></div>
      </div>
    </>
  );
};
