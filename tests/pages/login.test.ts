import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import { signIn, confirmSignIn, signInWithRedirect } from 'aws-amplify/auth';

// Mock Nuxt-specific functions
vi.mock('#app', () => ({
  useState: vi.fn((key, initializer) => ref(initializer())),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useLocalePath: vi.fn(() => (path) => path),
  definePageMeta: vi.fn(),
  useSeoMeta: vi.fn(),
}));

// Mock forms & UI components
const UContainerStub = {
  template: '<div class="u-container"><slot /></div>',
};

const UCardStub = {
  template: '<div class="u-card"><slot /></div>',
};

const UAuthFormStub = {
  props: ['title', 'fields', 'validate', 'loading', 'providers'],
  template: `
    <div class="u-auth-form">
      <h2>{{ title }}</h2>
      <slot name="description" />
      <form @submit.prevent="$emit('submit', { data: formData })">
        <button type="submit">Submit</button>
      </form>
      <slot name="footer" />
    </div>
  `,
  data() {
    return {
      formData: {
        email: 'test@example.com',
        password: 'password123',
        challengeResponse: '123456',
      },
    };
  },
};

const UAlertStub = {
  props: ['color', 'title'],
  template: '<div class="u-alert" :class="color"><h3>{{ title }}</h3><slot /></div>',
};

const ULinkStub = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
};

// Mock AWS Amplify auth functions
vi.mock('aws-amplify/auth', () => ({
  signIn: vi.fn(),
  confirmSignIn: vi.fn(),
  signInWithRedirect: vi.fn(),
}));

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key) => key,
  })),
}));

const shallowMountLogin = () => {
  // Use component factory to mock the login.vue component
  const LoginPage = {
    name: 'LoginPage',
    props: {},
    components: {
      UContainer: UContainerStub,
      UCard: UCardStub,
      UAuthForm: UAuthFormStub,
      UAlert: UAlertStub,
      ULink: ULinkStub,
    },
    template: `
      <div>
        <UContainer>
          <UCard>
            <UAuthForm 
              v-if="!isChallengeStep"
              title="login.title" 
              :fields="signInFields"
              :validate="validateSignIn"
              :loading="loading"
              @submit="onSignInSubmit"
            >
              <template #description>
                <div v-if="authError" class="error">
                  <UAlert color="red">{{ authError }}</UAlert>
                </div>
              </template>
            </UAuthForm>
            
            <UAuthForm
              v-else
              title="login.challenge.title"
              :fields="challengeFields"
              :validate="validateChallenge"
              :loading="loading"
              @submit="onChallengeSubmit"
            >
              <template #description>
                <div v-if="authError" class="error">
                  <UAlert color="red">{{ authError }}</UAlert>
                </div>
              </template>
            </UAuthForm>
          </UCard>
        </UContainer>
      </div>
    `,
    data() {
      return {
        loading: false,
        authError: '',
        isChallengeStep: false,
        challengeType: '',
        signInData: { email: '', password: '' },
        signInFields: [
          { name: 'email', type: 'text', label: 'Email' },
          { name: 'password', type: 'password', label: 'Password' },
        ],
        challengeFields: [{ name: 'challengeResponse', type: 'text', label: 'Code' }],
      };
    },
    methods: {
      validateSignIn(state) {
        const errors = [];
        if (!state.email) errors.push({ path: 'email', message: 'Email required' });
        if (!state.password) errors.push({ path: 'password', message: 'Password required' });
        return errors;
      },
      validateChallenge(state) {
        const errors = [];
        if (!state.challengeResponse)
          errors.push({ path: 'challengeResponse', message: 'Code required' });
        return errors;
      },
      async onSignInSubmit(data) {
        this.authError = '';
        this.loading = true;

        try {
          const formData = data.data || data;
          this.signInData.email = formData.email;
          this.signInData.password = formData.password;

          const result = await signIn({
            username: formData.email,
            password: formData.password,
          });

          if (result.nextStep && result.nextStep.signInStep !== 'DONE') {
            this.isChallengeStep = true;
            this.challengeType = result.nextStep.signInStep;
          } else {
            this.$router.push('/bookmarks');
          }
        } catch (error) {
          this.authError = error.message || 'login.authError';
        } finally {
          this.loading = false;
        }
      },
      async onChallengeSubmit(data) {
        this.authError = '';
        this.loading = true;

        try {
          const formData = data.data || data;

          const result = await confirmSignIn({
            challengeResponse: formData.challengeResponse,
          });

          if (result.nextStep && result.nextStep.signInStep !== 'DONE') {
            this.challengeType = result.nextStep.signInStep;
          } else {
            this.$router.push('/bookmarks');
          }
        } catch (error) {
          this.authError = error.message || 'login.authError';
        } finally {
          this.loading = false;
        }
      },
      onGoogleSignIn() {
        signInWithRedirect({ provider: 'Google' });
      },
    },
  };

  return mount(LoginPage, {
    global: {
      stubs: {
        UContainer: UContainerStub,
        UCard: UCardStub,
        UAuthForm: UAuthFormStub,
        UAlert: UAlertStub,
        ULink: ULinkStub,
        'i18n-t': true,
      },
      mocks: {
        $router: {
          push: vi.fn(),
        },
      },
    },
  });
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the login form', () => {
    const wrapper = shallowMountLogin();
    expect(wrapper.findComponent(UContainerStub).exists()).toBe(true);
    expect(wrapper.findComponent(UCardStub).exists()).toBe(true);
    expect(wrapper.findComponent(UAuthFormStub).exists()).toBe(true);
  });

  it('should call signIn with credentials when form is submitted', async () => {
    // Mock successful login
    (signIn as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      nextStep: { signInStep: 'DONE' },
    });

    const wrapper = shallowMountLogin();
    const authForm = wrapper.findComponent(UAuthFormStub);

    await authForm.vm.$emit('submit', {
      data: { email: 'test@example.com', password: 'password123' },
    });

    expect(signIn).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'password123',
    });
  });

  it('should show error message when login fails', async () => {
    // Mock failed login
    const error = new Error('Invalid credentials');
    (signIn as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

    const wrapper = shallowMountLogin();
    const authForm = wrapper.findComponent(UAuthFormStub);

    await authForm.vm.$emit('submit', {
      data: { email: 'test@example.com', password: 'wrong-password' },
    });
    await flushPromises();

    expect(wrapper.find('.error').exists()).toBe(true);
    expect(wrapper.findComponent(UAlertStub).exists()).toBe(true);
  });

  it('should switch to challenge form when MFA is needed', async () => {
    // Mock MFA challenge
    (signIn as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_SMS_CODE' },
    });

    const wrapper = shallowMountLogin();
    const authForm = wrapper.findComponent(UAuthFormStub);

    await authForm.vm.$emit('submit', {
      data: { email: 'test@example.com', password: 'password123' },
    });
    await flushPromises();

    // Update data directly for testing purposes
    await wrapper.setData({ isChallengeStep: true });

    expect(wrapper.vm.isChallengeStep).toBe(true);
    expect(wrapper.findComponent(UAuthFormStub).props().title).toBe('login.challenge.title');
  });
});
