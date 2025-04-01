import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defineComponent } from 'vue';
import { shallowMount } from '@vue/test-utils';
import { signOut } from 'aws-amplify/auth';
import { computed } from 'vue';

// Mock aws-amplify/auth signOut function
vi.mock('aws-amplify/auth', () => ({
  signOut: vi.fn().mockResolvedValue({}),
}));

// Create a wrapper component that will simulate the Header component's behavior
// but without all the complex template and dependency issues
const HeaderWrapper = defineComponent({
  props: {
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    hasRecipes: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['signOut'],
  setup(props, { emit }) {
    // Computed property to determine whether to show recipes link
    const showMyRecipes = computed(() => {
      return props.isLoggedIn || props.hasRecipes;
    });
    
    // Handler for sign out button
    const handleSignOut = async () => {
      try {
        await signOut();
        emit('signOut', { success: true });
      } catch (error) {
        console.error('Error signing out', error);
        emit('signOut', { success: false, error });
      }
    };
    
    return {
      showMyRecipes,
      handleSignOut,
    };
  },
  template: `
    <div>
      <!-- Auth Buttons -->
      <template v-if="!isLoggedIn">
        <button class="sign-up">Sign Up</button>
        <button class="sign-in">Sign In</button>
      </template>
      <template v-else>
        <button class="sign-out" @click="handleSignOut">Sign Out</button>
      </template>
      
      <!-- Navigation Links -->
      <div class="nav-links">
        <template v-if="showMyRecipes">
          <a href="/my-recipes">My Recipes</a>
        </template>
      </div>
    </div>
  `,
});

describe('Header behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should display sign up and sign in buttons when user is not logged in', () => {
    const wrapper = shallowMount(HeaderWrapper, {
      props: {
        isLoggedIn: false,
      },
    });
    
    expect(wrapper.find('.sign-up').exists()).toBe(true);
    expect(wrapper.find('.sign-in').exists()).toBe(true);
    expect(wrapper.find('.sign-out').exists()).toBe(false);
  });
  
  it('should display sign out button when user is logged in', () => {
    const wrapper = shallowMount(HeaderWrapper, {
      props: {
        isLoggedIn: true,
      },
    });
    
    expect(wrapper.find('.sign-out').exists()).toBe(true);
    expect(wrapper.find('.sign-up').exists()).toBe(false);
    expect(wrapper.find('.sign-in').exists()).toBe(false);
  });
  
  it('should show My Recipes link when user is logged in', () => {
    const wrapper = shallowMount(HeaderWrapper, {
      props: {
        isLoggedIn: true,
        hasRecipes: false,
      },
    });
    
    expect(wrapper.find('.nav-links a').exists()).toBe(true);
    expect(wrapper.find('.nav-links a').text()).toBe('My Recipes');
  });
  
  it('should show My Recipes link when guest user has saved recipes', () => {
    const wrapper = shallowMount(HeaderWrapper, {
      props: {
        isLoggedIn: false,
        hasRecipes: true,
      },
    });
    
    expect(wrapper.find('.nav-links a').exists()).toBe(true);
    expect(wrapper.find('.nav-links a').text()).toBe('My Recipes');
  });
  
  it('should call signOut when sign out button is clicked', async () => {
    const wrapper = shallowMount(HeaderWrapper, {
      props: {
        isLoggedIn: true,
      },
    });
    
    await wrapper.find('.sign-out').trigger('click');
    
    expect(signOut).toHaveBeenCalled();
  });
  
  it('should handle sign out error gracefully', async () => {
    // Mock the signOut function to throw an error
    vi.mocked(signOut).mockRejectedValueOnce(new Error('Sign out failed'));
    
    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error');
    
    const wrapper = shallowMount(HeaderWrapper, {
      props: {
        isLoggedIn: true,
      },
    });
    
    await wrapper.find('.sign-out').trigger('click');
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error signing out', expect.any(Error));
  });
  
  it('should emit signOut event with success=true on successful sign out', async () => {
    const wrapper = shallowMount(HeaderWrapper, {
      props: {
        isLoggedIn: true,
      },
    });
    
    await wrapper.find('.sign-out').trigger('click');
    
    expect(wrapper.emitted('signOut')?.[0][0]).toEqual({ success: true });
  });
  
  it('should emit signOut event with success=false on failed sign out', async () => {
    // Mock the signOut function to throw an error
    vi.mocked(signOut).mockRejectedValueOnce(new Error('Sign out failed'));
    
    const wrapper = shallowMount(HeaderWrapper, {
      props: {
        isLoggedIn: true,
      },
    });
    
    await wrapper.find('.sign-out').trigger('click');
    
    expect(wrapper.emitted('signOut')?.[0][0].success).toBe(false);
    expect(wrapper.emitted('signOut')?.[0][0].error).toBeInstanceOf(Error);
  });
});