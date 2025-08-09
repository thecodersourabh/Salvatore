import { Palette, Users, Award, Sparkles } from 'lucide-react';

export function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-cover bg-center" style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&q=80")'
      }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-3xl px-4">
            <h1 className="text-5xl font-bold mb-4">Crafting Dreams into Fabric</h1>
            <p className="text-xl">Since 1970, we've been transforming creative visions into beautiful, custom-made fabrics.</p>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            At FabricCraft, we believe that every piece of fabric tells a story. Our mission is to empower creators, designers, and dreamers to bring their unique visions to life through high-quality, custom-printed fabrics.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Palette className="h-8 w-8" />}
              title="Premium Quality"
              description="We use the finest materials and advanced printing technology to ensure vibrant, long-lasting results."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Expert Support"
              description="Our team of design specialists is here to help you every step of the way."
            />
            <FeatureCard
              icon={<Award className="h-8 w-8" />}
              title="Satisfaction Guaranteed"
              description="We stand behind our products with a 100% satisfaction guarantee."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="Endless Possibilities"
              description="From custom bedding to designer prints, bring any design to life."
            />
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80"
              alt="Fabric Workshop"
              className="rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Founded in 1970, FabricCraft began as a small family-owned textile shop with a big dream: to revolutionize custom fabric printing.
              </p>
              <p>
                Today, we've grown into a leading digital fabric printing service, combining traditional craftsmanship with cutting-edge technology to deliver exceptional quality and creativity to designers worldwide.
              </p>
              <p>
                Our commitment to innovation, sustainability, and customer satisfaction has made us the trusted choice for both individual creators and industry professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="text-rose-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}