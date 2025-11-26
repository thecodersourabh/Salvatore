import { Palette, Users, Award, Sparkles } from 'lucide-react';

export function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-cover bg-center" style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80")'
      }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-3xl px-4">
            <h1 className="text-5xl font-bold mb-4">Salvatore — Connect. Discover. Partner.</h1>
            <p className="text-xl">A platform that connects service seekers with trusted providers and partners.</p>
            <p className="mt-4 text-sm opacity-90">Official site: <a href="https://partners.oiomart" className="underline">partners.oiomart</a></p>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Salvatore's mission is to make it effortless for individuals and businesses to find, evaluate, and partner with the right service providers. We focus on clear discovery, reliable partnerships, and an intuitive experience.
          </p>
          <p className="mt-4 text-sm text-gray-500">Maintained by <a href="https://github.com/thecodersourabh" className="underline">thecodersourabh</a></p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Verified Partners"
              description="Discover curated and verified providers to ensure high quality and trust."
            />
            <FeatureCard
              icon={<Palette className="h-8 w-8" />}
              title="Easy Discovery"
              description="Advanced filters and smart matching help you find the right partner quickly."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="Seamless Collaboration"
              description="Tools and workflows that simplify hiring, communication, and delivery."
            />
            <FeatureCard
              icon={<Award className="h-8 w-8" />}
              title="Secure & Reliable"
              description="We prioritize data privacy and reliability so you can work with confidence."
            />
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="w-full">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
              alt="Team collaboration"
              className="w-full h-64 md:h-96 max-h-[420px] object-cover rounded-lg shadow-lg"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">About Salvatore</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Salvatore is built to bridge the gap between demand and verified supply across a wide range of professional services. Whether you're looking for a consultant, designer, or technical expert, Salvatore helps you connect with the right partner.
              </p>
              <p>
                We emphasize transparency, verified profiles, and straightforward collaboration tools so engagements start smoothly and deliver results.
              </p>
              <p>
                Visit our partner portal at <a href="https://partners.oiomart.com" className="underline">partners.oiomart.com</a> to learn more or to join as a service provider.
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