import { useState } from 'react';
import { X, Calendar, MapPin, Clock, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { EventRegistrationService } from '../../../services/eventRegistrationService';
import { EventService } from '../../../services/eventService';
import type { Event } from '../../../types/events';
import { format } from 'date-fns';
import { useAuthStore } from '../../../stores/authStore';
import { showNotification } from '../../../lib/notifications';

interface EventRegistrationModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export function EventRegistrationModal({ event, onClose, onSuccess }: EventRegistrationModalProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [formData, setFormData] = useState({
    dietary_requirements: '',
    accessibility_requirements: '',
    notes: '',
    agree_terms: false
  });

  if (!user) {
    return null;
  }

  // Calculate price based on membership
  const isMember = user.membership_status === 'active';
  let price = isMember ? event.member_price_cents : event.non_member_price_cents;
  let priceLabel = isMember ? 'Member Price' : 'Non-Member Price';
  
  // Check early bird
  const isEarlyBird = event.early_bird_price_cents && 
    event.early_bird_end_date && 
    new Date() < new Date(event.early_bird_end_date);
  
  if (isEarlyBird && event.early_bird_price_cents) {
    price = event.early_bird_price_cents;
    priceLabel = 'Early Bird Price';
  }

  const handleSubmit = async () => {
    if (!formData.agree_terms) {
      showNotification('error', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    
    try {
      await EventRegistrationService.registerForEvent(
        event.id,
        user.id,
        {
          dietary_requirements: formData.dietary_requirements,
          accessibility_requirements: formData.accessibility_requirements,
          notes: formData.notes
        }
      );
      
      setStep('confirmation');
      showNotification('success', 'Successfully registered for the event!');
      
      // Auto close and refresh after 3 seconds
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error: any) {
      console.error('Registration error:', error);
      showNotification('error', error.message || 'Failed to register for event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'confirmation' ? 'Registration Complete!' : 'Register for Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'details' && (
            <div className="space-y-6">
              {/* Event Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.start_date), 'PPP')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(event.start_date), 'p')} - 
                      {format(new Date(event.end_date), 'p')}
                    </span>
                  </div>
                  {event.venue_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Information */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{priceLabel}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {price === 0 ? 'Free' : EventService.formatPrice(price)}
                    </p>
                    {isEarlyBird && (
                      <p className="text-sm text-green-600 mt-1">
                        Early bird discount applied!
                      </p>
                    )}
                  </div>
                  <CreditCard className="h-8 w-8 text-primary-600" />
                </div>
              </div>

              {/* CPD Points */}
              {event.cpd_points > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Earn {event.cpd_points} CPD Points
                      </p>
                      <p className="text-sm text-gray-600">
                        Certificate will be issued upon attendance
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Additional Information (Optional)</h3>
                
                <div>
                  <Label htmlFor="dietary">Dietary Requirements</Label>
                  <Input
                    id="dietary"
                    value={formData.dietary_requirements}
                    onChange={(e) => setFormData({ ...formData, dietary_requirements: e.target.value })}
                    placeholder="e.g., Vegetarian, Gluten-free, Halal"
                  />
                </div>

                <div>
                  <Label htmlFor="accessibility">Accessibility Requirements</Label>
                  <Input
                    id="accessibility"
                    value={formData.accessibility_requirements}
                    onChange={(e) => setFormData({ ...formData, accessibility_requirements: e.target.value })}
                    placeholder="e.g., Wheelchair access, Hearing loop"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any other information we should know?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="border-t pt-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.agree_terms}
                    onChange={(e) => setFormData({ ...formData, agree_terms: e.target.checked })}
                    className="mt-1"
                  />
                  <div className="text-sm text-gray-600">
                    <p>I agree to the terms and conditions and understand that:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Registration is subject to availability</li>
                      <li>Cancellations must be made 48 hours in advance</li>
                      <li>CPD points will be awarded upon attendance</li>
                      <li>I will receive email reminders about this event</li>
                    </ul>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You're all set!
              </h3>
              <p className="text-gray-600 mb-6">
                Your registration for "{event.title}" has been confirmed.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <h4 className="font-medium text-gray-900 mb-2">What's next?</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>You'll receive a confirmation email shortly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>We'll send you reminders before the event</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Your CPD activity will be created automatically when you attend</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Certificate will be available after the event</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          {step === 'details' && (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !formData.agree_terms}>
                {loading ? 'Registering...' : 
                 price === 0 ? 'Register for Free' : `Register & Pay ${EventService.formatPrice(price)}`}
              </Button>
            </>
          )}
          
          {step === 'confirmation' && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}