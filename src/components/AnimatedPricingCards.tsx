import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Phone, Crown, Zap, Building } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface Plan {
  name: string;
  price: number | null;
  period: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  popular: boolean;
  features: string[];
  buttonText: string;
  buttonStyle: string;
  isContact?: boolean;
}

const AnimatedPricingCards = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [animationStage, setAnimationStage] = useState(0);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const plans: Plan[] = [
    {
      name: 'Pro',
      price: 29,
      period: '/mo',
      description: 'Solopreneurs, Lean Teams',
      icon: Zap,
      color: 'from-blue-500 to-purple-600',
      popular: false,
      features: [
        'Core tools',
        'Monthly credits',
        'Basic integrations',
        'Email support'
      ],
      buttonText: 'Start Free',
      buttonStyle: isDark 
        ? 'border-2 border-muted hover:border-border text-foreground hover:bg-muted' 
        : 'border-2 border-border hover:border-muted text-foreground hover:bg-surface-elevated'
    },
    {
      name: 'Growth',
      price: 99,
      period: '/mo',
      description: 'Coaches, Startups, SMBs',
      icon: Zap,
      color: 'from-purple-500 to-pink-600',
      popular: true,
      features: [
        'More credits',
        'Advanced integrations',
        '3 team seats',
        'Priority support',
        'Custom templates'
      ],
      buttonText: 'Start Free',
      buttonStyle: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white'
    },
    {
      name: 'Elite',
      price: 199,
      period: '/mo',
      description: 'Agencies, Scaleups',
      icon: Crown,
      color: 'from-yellow-500 to-orange-600',
      popular: false,
      features: [
        'All features',
        'Unlimited automations',
        '5 team seats',
        'Priority support',
        'White-label options'
      ],
      buttonText: 'Start Free',
      buttonStyle: isDark 
        ? 'border-2 border-muted hover:border-border text-foreground hover:bg-muted' 
        : 'border-2 border-border hover:border-muted text-foreground hover:bg-surface-elevated'
    },
    {
      name: 'Custom',
      price: null,
      period: '',
      description: 'Enterprise/Big Teams',
      icon: Building,
      color: 'from-gray-500 to-gray-700',
      popular: false,
      features: [
        'Bespoke features',
        'VIP onboarding',
        'Unlimited seats',
        'Dedicated support',
        'Custom integrations'
      ],
      buttonText: 'Contact Sales',
      buttonStyle: isDark 
        ? 'border-2 border-muted hover:border-border text-foreground hover:bg-muted' 
        : 'border-2 border-border hover:border-muted text-foreground hover:bg-surface-elevated',
      isContact: true
    }
  ];

  useEffect(() => {
    // Staggered animation entrance
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    const timer2 = setTimeout(() => setAnimationStage(1), 300);
    const timer3 = setTimeout(() => setAnimationStage(2), 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const PricingCard = ({ plan, index, isHovered, onHover, onLeave }: {
    plan: Plan;
    index: number;
    isHovered: boolean;
    onHover: (index: number) => void;
    onLeave: () => void;
  }) => {
    const IconComponent = plan.icon;
    
    return (
      <div
        className={`relative group transition-all duration-700 ease-out transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        } ${isHovered ? 'scale-105 z-10' : 'scale-100'}`}
        style={{ transitionDelay: `${index * 150}ms` }}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={onLeave}
      >
        {/* Glow effect for popular plan */}
        {plan.popular && (
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
        )}
        
        {/* Main card */}
        <div className={`relative rounded-2xl p-6 sm:p-8 h-full transition-all duration-300 bg-card border hover:border-muted shadow-lg hover:shadow-xl ${
          plan.popular ? 'ring-2 ring-purple-500/50' : ''
        }`}>
          
          {/* Popular badge */}
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold animate-pulse-subtle">
                Most Popular
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${plan.color} transform transition-transform duration-300 ${
                isHovered ? 'rotate-12 scale-110' : 'rotate-0 scale-100'
              }`}>
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">
              {plan.name}
            </h3>
            
            <div className="mb-2">
              {plan.price ? (
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-base sm:text-lg text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  Contact
                </div>
              )}
            </div>
            
            <p className="text-sm sm:text-base text-muted-foreground">
              {plan.description}
            </p>
          </div>

          {/* Features */}
          <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
            {plan.features.map((feature, featureIndex) => (
              <div 
                key={featureIndex}
                className={`flex items-center transition-all duration-300 ${
                  animationStage >= 1 ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: `${(index * 150) + (featureIndex * 100)}ms` }}
              >
                <div className="flex-shrink-0 mr-3">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                </div>
                <span className="text-sm sm:text-base text-foreground">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Button */}
          <div className={`transition-all duration-500 ${
            animationStage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <Link 
              to={plan.isContact ? "/contact" : "/signup"} 
              className="block"
            >
              <button className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                plan.buttonStyle
              } group/btn`}>
                <span className="flex items-center justify-center">
                  {plan.isContact ? (
                    <>
                      <Phone className="w-4 h-4 mr-2 transition-transform duration-300 group-hover/btn:rotate-12" />
                      {plan.buttonText}
                    </>
                  ) : (
                    <>
                      {plan.buttonText}
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-16">
          <div className={`transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Plans That Scale
              <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                With You
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              ✨ Try it free—no credit card required
            </p>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 mb-8 sm:mb-12">
          {plans.map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan}
              index={index}
              isHovered={hoveredCard === index}
              onHover={setHoveredCard}
              onLeave={() => setHoveredCard(null)}
            />
          ))}
        </div>

        {/* Bottom Actions */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-700 ${
          animationStage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`} style={{ transitionDelay: '800ms' }}>
          <Link to="/pricing">
            <button className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 bg-card hover:bg-surface-elevated text-foreground border border-border shadow-md hover:shadow-lg">
              Compare Plans
            </button>
          </Link>
          
          <button className="w-full sm:w-auto flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-300 transform hover:scale-105 group">
            <Phone className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
            Book Strategy Call
          </button>
        </div>

        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-opacity duration-1000 ${
            isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'
          } ${isVisible ? 'opacity-100' : 'opacity-0'}`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl transition-opacity duration-1000 ${
            isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
          } ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '500ms' }}></div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedPricingCards;