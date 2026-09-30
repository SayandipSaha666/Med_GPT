import { authService } from './auth/auth.service';
import { chatService } from './chats/chats.service';
import { billingService } from './billing/billing.service';
import { profileService } from './profile/profile.service';

export const ApiService = {
  auth: authService,
  chats: chatService,
  billing: billingService,
  profile: profileService,
};
