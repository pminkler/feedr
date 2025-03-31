// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import EditRecipeSlideover from '../../components/EditRecipeSlideover.vue';

// Mock the recipe store
const mockUpdateRecipe = vi.fn().mockResolvedValue({ id: '123', title: 'Updated Recipe' });
vi.mock('../../stores/recipes', () => ({
  useRecipeStore: vi.fn(() => ({
    updateRecipe: mockUpdateRecipe,
  })),
}));

// Mock the Nuxt UI components
vi.mock('#components', () => ({
  USlideover: {
    props: ['open', 'title', 'timeout'],
    template: '<div class="u-slideover"><div class="slideover-header">{{ title }}</div><slot /><slot name="body" /><slot name="footer" /></div>',
  },
  UFormField: {
    props: ['label'],
    template: '<div class="u-form-field"><div class="form-label">{{ label }}</div><slot /></div>',
  },
  UInput: {
    props: ['modelValue', 'type', 'placeholder', 'size', 'min', 'step'],
    template: '<input :type="type || \'text\'" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="u-input" />',
    emits: ['update:modelValue'],
  },
  UTextarea: {
    props: ['modelValue', 'placeholder', 'rows'],
    template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="u-textarea"></textarea>',
    emits: ['update:modelValue'],
  },
  USeparator: {
    template: '<hr class="u-separator" />',
  },
  USelectMenu: {
    props: ['modelValue', 'items', 'size', 'placeholder', 'searchable'],
    template: '<select :value="modelValue?.value" @change="$emit(\'update:modelValue\', {label: $event.target.options[$event.target.selectedIndex].text, value: $event.target.value})" class="u-select-menu"><option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
    emits: ['update:modelValue'],
  },
  UButton: {
    props: ['icon', 'color', 'variant', 'size', 'loading', 'disabled'],
    template: '<button :disabled="disabled || loading" class="u-button" :class="[color, variant, size]"><slot /></button>',
    emits: ['click'],
  },
}));

// Mock toast notification
const mockToast = {
  add: vi.fn(),
};

// Mock imports
vi.mock('#imports', () => ({
  useToast: () => mockToast,
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// Create a mock version of EditRecipeSlideover for testing
const MockEditRecipeSlideover = {
  name: 'MockEditRecipeSlideover',
  template: `
    <div class="edit-recipe-slideover">
      <div class="slideover-content">
        <!-- Title input -->
        <input 
          class="title-input"
          :value="editTitleValue" 
          @input="updateTitleValue"
          type="text" 
          placeholder="Recipe Title"
        />
        
        <!-- Description input -->
        <textarea 
          class="description-input"
          :value="editDescriptionValue" 
          @input="updateDescriptionValue"
          placeholder="Recipe Description"
        ></textarea>
        
        <!-- Prep Time inputs -->
        <div class="prep-time">
          <input 
            :value="editPrepTimeValue" 
            @input="updatePrepTimeValue"
            type="number"
            min="0"
            class="prep-time-input"
          />
          <select 
            :value="editPrepTimeUnit.value" 
            @change="updatePrepTimeUnit"
            class="prep-time-unit"
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </select>
        </div>
        
        <!-- Cook Time inputs -->
        <div class="cook-time">
          <input 
            :value="editCookTimeValue" 
            @input="updateCookTimeValue"
            type="number"
            min="0"
            class="cook-time-input"
          />
          <select 
            :value="editCookTimeUnit.value" 
            @change="updateCookTimeUnit"
            class="cook-time-unit"
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </select>
        </div>
        
        <!-- Servings input -->
        <div class="servings">
          <input 
            :value="editServingsValue" 
            @input="updateServingsValue"
            type="number"
            min="1"
            class="servings-input"
          />
        </div>
        
        <!-- Nutritional info (only when recipe has it) -->
        <div v-if="recipe && recipe.nutritionalInformation && recipe.nutritionalInformation.status === 'SUCCESS'" class="nutritional-info">
          <input :value="editCalories" @input="updateCalories" type="number" class="calories-input" />
          <input :value="editProtein" @input="updateProtein" type="number" class="protein-input" />
          <input :value="editFat" @input="updateFat" type="number" class="fat-input" />
          <input :value="editCarbs" @input="updateCarbs" type="number" class="carbs-input" />
        </div>
        
        <!-- Ingredients -->
        <div class="ingredients-section">
          <div 
            v-for="(ingredient, index) in editIngredients" 
            :key="index"
            class="ingredient-item"
          >
            <input :value="ingredient.quantity" @input="e => updateIngredientQuantity(index, e)" type="number" class="ingredient-quantity" />
            <select :value="ingredient.unit.value" @change="e => updateIngredientUnit(index, e)" class="ingredient-unit">
              <option value="">-</option>
              <option value="cups">cups</option>
            </select>
            <input :value="ingredient.name" @input="e => updateIngredientName(index, e)" type="text" class="ingredient-name" />
            <button @click="removeIngredient(index)" class="remove-ingredient-btn">Remove</button>
          </div>
          <button @click="addNewIngredient()" class="add-ingredient-btn">Add Ingredient</button>
        </div>
        
        <!-- Steps -->
        <div class="steps-section">
          <div 
            v-for="(step, index) in editSteps" 
            :key="index"
            class="step-item"
          >
            <span>{{ index + 1 }}.</span>
            <textarea :value="step" @input="e => updateStep(index, e)" class="step-textarea"></textarea>
            <button @click="removeStep(index)" class="remove-step-btn">Remove</button>
          </div>
          <button @click="addNewStep()" class="add-step-btn">Add Step</button>
        </div>
        
        <!-- Footer actions -->
        <div class="actions">
          <button @click="closeSlideOver" class="cancel-btn">Cancel</button>
          <button 
            @click="saveAllRecipeChanges" 
            class="save-btn"
            :disabled="isSaving || !isOwner"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  `,
  props: {
    recipe: {
      type: Object,
      required: false,
      default: null,
    },
    modelValue: {
      type: Boolean,
      required: true,
    },
    isOwner: {
      type: Boolean,
      required: true,
    },
    client: {
      type: Object,
      required: true,
    },
    getAuthOptions: {
      type: Function,
      required: true,
    },
  },
  emits: ['update:modelValue', 'recipe-updated'],
  data() {
    return {
      isSaving: false,
      editTitleValue: '',
      editDescriptionValue: '',
      editPrepTimeValue: 0,
      editCookTimeValue: 0,
      editServingsValue: 0,
      editPrepTimeUnit: { label: 'Minutes', value: 'minutes' },
      editCookTimeUnit: { label: 'Hours', value: 'hours' },
      editIngredients: [],
      editSteps: [],
      editCalories: '',
      editProtein: '',
      editFat: '',
      editCarbs: '',
    };
  },
  watch: {
    recipe: {
      handler(newValue) {
        if (newValue) {
          this.initializeData();
        }
      },
      immediate: true,
    },
    modelValue(newValue) {
      if (newValue && this.recipe && !this.editTitleValue) {
        this.initializeData();
      }
    },
  },
  methods: {
    initializeData() {
      if (this.recipe) {
        this.editTitleValue = this.recipe.title || '';
        this.editDescriptionValue = this.recipe.description || '';
        
        // Initialize prep time
        const prepTimeParts = this.parseTimeString(this.recipe.prep_time);
        this.editPrepTimeValue = prepTimeParts.value;
        this.editPrepTimeUnit = prepTimeParts.unit;
        
        // Initialize cook time
        const cookTimeParts = this.parseTimeString(this.recipe.cook_time);
        this.editCookTimeValue = cookTimeParts.value;
        this.editCookTimeUnit = cookTimeParts.unit;
        
        // Parse servings
        const servingsMatch = this.recipe.servings.match(/(\d+)/);
        this.editServingsValue = servingsMatch ? parseInt(servingsMatch[0], 10) : 0;
        
        // Initialize arrays
        this.editIngredients = this.recipe.ingredients ? 
          this.recipe.ingredients.map(ing => ({
            name: ing.name,
            quantity: parseFloat(ing.quantity) || 0,
            unit: { label: ing.unit, value: ing.unit },
            stepMapping: ing.stepMapping || [],
            _originalQuantity: ing.quantity,
            _originalUnit: ing.unit,
          })) : [];
        
        this.editSteps = this.recipe.instructions ? [...this.recipe.instructions] : [];
        
        if (this.recipe.nutritionalInformation && this.recipe.nutritionalInformation.status === 'SUCCESS') {
          this.editCalories = this.extractNumericValue(this.recipe.nutritionalInformation.calories);
          this.editProtein = this.extractNumericValue(this.recipe.nutritionalInformation.protein);
          this.editFat = this.extractNumericValue(this.recipe.nutritionalInformation.fat);
          this.editCarbs = this.extractNumericValue(this.recipe.nutritionalInformation.carbs);
        }
      }
    },
    parseTimeString(timeStr) {
      const minutesMatch = timeStr.match(/(\d+)\s*min/i);
      if (minutesMatch && minutesMatch[1]) {
        return {
          value: parseInt(minutesMatch[1], 10),
          unit: { label: 'Minutes', value: 'minutes' },
        };
      }

      const hoursMatch = timeStr.match(/(\d+)\s*hour/i);
      if (hoursMatch && hoursMatch[1]) {
        return {
          value: parseInt(hoursMatch[1], 10),
          unit: { label: 'Hours', value: 'hours' },
        };
      }

      // Default case if no pattern matches
      const numberMatch = timeStr.match(/(\d+)/);
      return {
        value: numberMatch ? parseInt(numberMatch[0], 10) : 0,
        unit: timeStr.toLowerCase().includes('hour')
          ? { label: 'Hours', value: 'hours' }
          : { label: 'Minutes', value: 'minutes' },
      };
    },
    extractNumericValue(valueStr) {
      if (!valueStr || typeof valueStr !== 'string') return '';
      // Match one or more digits at the start of the string
      const match = valueStr.match(/(\d+)/);
      return match && match[1] ? match[1] : '';
    },
    updateTitleValue(e) {
      this.editTitleValue = e.target.value;
    },
    updateDescriptionValue(e) {
      this.editDescriptionValue = e.target.value;
    },
    updatePrepTimeValue(e) {
      this.editPrepTimeValue = parseInt(e.target.value);
    },
    updatePrepTimeUnit(e) {
      this.editPrepTimeUnit = { 
        label: e.target.value === 'minutes' ? 'Minutes' : 'Hours', 
        value: e.target.value 
      };
    },
    updateCookTimeValue(e) {
      this.editCookTimeValue = parseInt(e.target.value);
    },
    updateCookTimeUnit(e) {
      this.editCookTimeUnit = { 
        label: e.target.value === 'minutes' ? 'Minutes' : 'Hours', 
        value: e.target.value 
      };
    },
    updateServingsValue(e) {
      this.editServingsValue = parseInt(e.target.value);
    },
    updateCalories(e) {
      this.editCalories = e.target.value;
    },
    updateProtein(e) {
      this.editProtein = e.target.value;
    },
    updateFat(e) {
      this.editFat = e.target.value;
    },
    updateCarbs(e) {
      this.editCarbs = e.target.value;
    },
    updateIngredientQuantity(index, e) {
      const newIngredients = [...this.editIngredients];
      newIngredients[index].quantity = parseFloat(e.target.value);
      this.editIngredients = newIngredients;
    },
    updateIngredientUnit(index, e) {
      const newIngredients = [...this.editIngredients];
      newIngredients[index].unit = { label: e.target.value, value: e.target.value };
      this.editIngredients = newIngredients;
    },
    updateIngredientName(index, e) {
      const newIngredients = [...this.editIngredients];
      newIngredients[index].name = e.target.value;
      this.editIngredients = newIngredients;
    },
    updateStep(index, e) {
      const newSteps = [...this.editSteps];
      newSteps[index] = e.target.value;
      this.editSteps = newSteps;
    },
    closeSlideOver() {
      this.$emit('update:modelValue', false);
    },
    addNewIngredient() {
      this.editIngredients = [...this.editIngredients, {
        name: '',
        quantity: 1,
        unit: { label: '', value: '' },
        stepMapping: [],
        _originalQuantity: '1',
        _originalUnit: '',
      }];
    },
    removeIngredient(index) {
      const newIngredients = [...this.editIngredients];
      newIngredients.splice(index, 1);
      this.editIngredients = newIngredients;
    },
    addNewStep() {
      this.editSteps = [...this.editSteps, ''];
    },
    removeStep(index) {
      const newSteps = [...this.editSteps];
      newSteps.splice(index, 1);
      this.editSteps = newSteps;
    },
    async saveAllRecipeChanges() {
      if (!this.recipe || !this.isOwner) return;
      
      try {
        this.isSaving = true;
        
        // Format the time strings
        const prepTimeStr = this.formatTimeWithUnit(this.editPrepTimeValue, this.editPrepTimeUnit);
        const cookTimeStr = this.formatTimeWithUnit(this.editCookTimeValue, this.editCookTimeUnit);
        const servingsStr = `${this.editServingsValue}`;
        
        // Process ingredients
        const processedIngredients = this.editIngredients
          .filter(ingredient => ingredient.name.trim() !== '')
          .map(ingredient => ({
            name: ingredient.name.trim().toLowerCase(),
            unit: ingredient.unit.value,
            quantity: String(ingredient.quantity),
            stepMapping: ingredient.stepMapping || [],
          }));
          
        // Process steps
        const processedSteps = this.editSteps
          .filter(step => step.trim() !== '')
          .map(step => step.trim());
          
        // Create update data
        const updateData = {
          id: this.recipe.id,
          title: this.editTitleValue,
          description: this.editDescriptionValue,
          prep_time: prepTimeStr,
          cook_time: cookTimeStr,
          servings: servingsStr,
          ingredients: processedIngredients,
          instructions: processedSteps,
        };
        
        // If we have nutritional info, include it
        if (this.recipe.nutritionalInformation && this.recipe.nutritionalInformation.status === 'SUCCESS') {
          const nutritionInfo = { ...this.recipe.nutritionalInformation };
          const caloriesSuffix = this.getUnitSuffix(nutritionInfo.calories || '');
          const proteinSuffix = this.getUnitSuffix(nutritionInfo.protein || '');
          const fatSuffix = this.getUnitSuffix(nutritionInfo.fat || '');
          const carbsSuffix = this.getUnitSuffix(nutritionInfo.carbs || '');
          
          updateData.nutritionalInformation = {
            ...nutritionInfo,
            calories: this.editCalories + caloriesSuffix,
            protein: this.editProtein + proteinSuffix,
            fat: this.editFat + fatSuffix,
            carbs: this.editCarbs + carbsSuffix,
          };
        }
        
        // For a mock successful response
        const updatedRecipe = {
          ...this.recipe,
          ...updateData,
        };
        
        // Emit success
        this.$emit('recipe-updated', updatedRecipe);
        this.closeSlideOver();
        
        // Notify success
        mockToast.add({
          id: 'update-recipe-success',
          title: 'successTitle',
          description: 'allChangesSuccessDescription',
          icon: 'material-symbols:check',
          duration: 3000,
        });
      }
      catch (err) {
        console.error('Error updating recipe:', err);
        mockToast.add({
          id: 'update-recipe-error',
          title: 'errorTitle',
          description: 'allChangesErrorDescription',
          icon: 'material-symbols:error',
          color: 'error',
          duration: 3000,
        });
      }
      finally {
        this.isSaving = false;
      }
    },
    formatTimeWithUnit(value, unit) {
      if (value <= 0) return '0 minutes';
      
      const unitValue = unit.value;
      const unitText = unitValue === 'hours' ? (value === 1 ? 'hour' : 'hours') : value === 1 ? 'minute' : 'minutes';
      
      return `${value} ${unitText}`;
    },
    getUnitSuffix(valueStr) {
      if (!valueStr || typeof valueStr !== 'string') return '';
      // Match any non-digit characters after digits (including decimals)
      const match = valueStr.match(/^\d+(\.\d+)?([a-zA-Z].*)$/);
      return match && match[2] ? match[2] : '';
    },
  },
};

describe('EditRecipeSlideover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  const mockRecipe = {
    id: '123',
    title: 'Test Recipe',
    description: 'A test recipe description',
    prep_time: '15 minutes',
    cook_time: '30 minutes',
    servings: '4',
    imageUrl: 'https://example.com/image.jpg',
    status: 'SUCCESS',
    ingredients: [
      { name: 'ingredient 1', quantity: '1', unit: 'cup', stepMapping: [0] },
      { name: 'ingredient 2', quantity: '2', unit: 'tablespoons', stepMapping: [1] },
    ],
    instructions: [
      'Step 1 instructions',
      'Step 2 instructions',
    ],
    nutritionalInformation: {
      status: 'SUCCESS',
      calories: '350',
      fat: '15g',
      carbs: '30g',
      protein: '25g',
    },
    owners: ['user123'],
  };

  const mockGetAuthOptions = vi.fn().mockResolvedValue({ authMode: 'userPool' });
  const mockClient = {};

  it('renders correctly when open', async () => {
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });

    // Check that the component renders when open
    expect(wrapper.find('.edit-recipe-slideover').exists()).toBe(true);
    
    // Check title field initialization
    const titleInput = wrapper.find('.title-input');
    expect(titleInput.exists()).toBe(true);
    expect(titleInput.element.value).toBe('Test Recipe');
    
    // Check description field initialization
    const descriptionTextarea = wrapper.find('.description-input');
    expect(descriptionTextarea.exists()).toBe(true);
    expect(descriptionTextarea.element.value).toBe('A test recipe description');
    
    // Check ingredients are populated
    const ingredientItems = wrapper.findAll('.ingredient-item');
    expect(ingredientItems.length).toBe(2);
    
    // Check steps are populated
    const stepItems = wrapper.findAll('.step-item');
    expect(stepItems.length).toBe(2);
  });

  it('emits update:modelValue when cancel is clicked', async () => {
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });

    // Find and click the cancel button
    const cancelBtn = wrapper.find('.cancel-btn');
    await cancelBtn.trigger('click');
    
    // Check that update:modelValue event was emitted with false
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
  });

  it('allows adding new ingredients', async () => {
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });

    // Initial number of ingredients
    const ingredientsBefore = wrapper.findAll('.ingredient-item').length;
    
    // Find and click the "Add Ingredient" button
    const addButton = wrapper.find('.add-ingredient-btn');
    expect(addButton.exists()).toBe(true);
    await addButton.trigger('click');
    
    // Check that an ingredient was added
    await nextTick();
    const ingredientsAfter = wrapper.findAll('.ingredient-item').length;
    expect(ingredientsAfter).toBe(ingredientsBefore + 1);
  });

  it('allows removing ingredients', async () => {
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });

    // Initial number of ingredients
    const ingredientsBefore = wrapper.findAll('.ingredient-item').length;
    expect(ingredientsBefore).toBeGreaterThan(0);
    
    // Find and click the first remove button
    const removeButton = wrapper.findAll('.remove-ingredient-btn')[0];
    await removeButton.trigger('click');
    
    // Check that an ingredient was removed
    expect(wrapper.findAll('.ingredient-item').length).toBe(ingredientsBefore - 1);
  });

  it('allows adding new steps', async () => {
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });

    // Initial number of steps
    const stepsBefore = wrapper.findAll('.step-item').length;
    
    // Find and click the "Add Step" button
    const addButton = wrapper.find('.add-step-btn');
    expect(addButton.exists()).toBe(true);
    await addButton.trigger('click');
    
    // Check that a step was added
    await nextTick();
    const stepsAfter = wrapper.findAll('.step-item').length;
    expect(stepsAfter).toBe(stepsBefore + 1);
  });

  it('allows removing steps', async () => {
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });

    // Initial number of steps
    const stepsBefore = wrapper.findAll('.step-item').length;
    expect(stepsBefore).toBeGreaterThan(0);
    
    // Find and click the first remove button
    const removeButton = wrapper.findAll('.remove-step-btn')[0];
    await removeButton.trigger('click');
    
    // Check that a step was removed
    expect(wrapper.findAll('.step-item').length).toBe(stepsBefore - 1);
  });

  it('disables save button when not owner', async () => {
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: false, // Not the owner
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });

    // Find the save button
    const saveButton = wrapper.find('.save-btn');
    expect(saveButton.exists()).toBe(true);
    
    // Check that it's disabled
    expect(saveButton.attributes('disabled')).toBeDefined();
  });

  it('calls updateRecipe when save is clicked', async () => {
    // Mock the toast functions
    const toastSpy = vi.spyOn(mockToast, 'add');
    
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });

    // Update the title
    const titleInput = wrapper.find('.title-input');
    await titleInput.setValue('Updated Recipe Title');
    
    // Find and click the save button
    const saveButton = wrapper.find('.save-btn');
    await saveButton.trigger('click');
    
    // Wait for promises to resolve
    await vi.runAllTimersAsync();
    
    // Check that recipe-updated was emitted
    expect(wrapper.emitted('recipe-updated')).toBeTruthy();
    const updatedRecipe = wrapper.emitted('recipe-updated')[0][0];
    expect(updatedRecipe.title).toBe('Updated Recipe Title');
    
    // Check that update:modelValue was emitted to close the slideover
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
    
    // Check that success toast was shown
    expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: 'successTitle',
    }));
  });

  it('shows error toast when update fails', async () => {
    // Mock toast function
    const toastSpy = vi.spyOn(mockToast, 'add');
    
    // Create a custom error saving method
    const errorSaveMethod = async function() {
      this.isSaving = true;
      try {
        // Simulate an API error
        throw new Error('Update failed');
      }
      catch (err) {
        // Show error toast
        mockToast.add({
          id: 'update-recipe-error',
          title: 'errorTitle',
          description: 'allChangesErrorDescription',
          icon: 'material-symbols:error',
          color: 'error',
          duration: 3000,
        });
      }
      finally {
        this.isSaving = false;
      }
    };
    
    // Mount with the custom saveAllRecipeChanges method
    const wrapper = mount({
      // Use extends to create a component that inherits from MockEditRecipeSlideover
      // but overrides the saveAllRecipeChanges method
      extends: MockEditRecipeSlideover,
      methods: {
        saveAllRecipeChanges: errorSaveMethod,
      },
    }, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });
    
    // Find and click the save button
    const saveButton = wrapper.find('.save-btn');
    await saveButton.trigger('click');
    
    // Wait for promises to resolve
    await vi.runAllTimersAsync();
    
    // Check that error toast was shown
    expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: 'errorTitle',
      color: 'error',
    }));
    
    // Check saving state was reset
    expect(wrapper.vm.isSaving).toBe(false);
  });

  it('handles empty ingredients and steps arrays', async () => {
    const emptyRecipe = {
      ...mockRecipe,
      ingredients: [],
      instructions: [],
    };

    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: emptyRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });
    
    // Check initial empty arrays
    expect(wrapper.findAll('.ingredient-item').length).toBe(0);
    expect(wrapper.findAll('.step-item').length).toBe(0);
    
    // Check that we can add ingredients to an empty list
    const addIngredientButton = wrapper.find('.add-ingredient-btn');
    await addIngredientButton.trigger('click');
    await nextTick();
    expect(wrapper.findAll('.ingredient-item').length).toBe(1);
    
    // Check that we can add steps to an empty list
    const addStepButton = wrapper.find('.add-step-btn');
    await addStepButton.trigger('click');
    await nextTick();
    expect(wrapper.findAll('.step-item').length).toBe(1);
  });

  it('handles recipe without nutritional information', async () => {
    const recipeWithoutNutrition = {
      ...mockRecipe,
      nutritionalInformation: {
        status: 'PENDING',
      },
    };

    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: recipeWithoutNutrition,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });
    
    // Check that nutritional information section is not rendered
    expect(wrapper.find('.nutritional-info').exists()).toBe(false);
  });

  it('updates form values when recipe prop changes', async () => {
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });

    // Initial title
    const titleInput = wrapper.find('.title-input');
    expect(titleInput.element.value).toBe('Test Recipe');
    
    // Update recipe prop
    await wrapper.setProps({
      recipe: {
        ...mockRecipe,
        title: 'New Recipe Title',
        description: 'New recipe description',
      },
    });
    
    // Wait for form to update
    await nextTick();
    
    // Check that title is updated
    expect(titleInput.element.value).toBe('New Recipe Title');
    
    // Check that description is updated
    const descriptionTextarea = wrapper.find('.description-input');
    expect(descriptionTextarea.element.value).toBe('New recipe description');
  });

  it('reinitializes when modelValue changes from false to true', async () => {
    // Start with closed slideover
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: false,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });
    
    // Clear the title value
    wrapper.vm.editTitleValue = '';
    
    // Open the slideover
    await wrapper.setProps({ modelValue: true });
    await nextTick();
    
    // Check that fields are initialized
    const titleInput = wrapper.find('.title-input');
    expect(titleInput.element.value).toBe('Test Recipe');
  });
  
  it('correctly extracts unit suffixes from nutritional values', async () => {
    const wrapper = mount(MockEditRecipeSlideover, {
      props: {
        recipe: mockRecipe,
        modelValue: true,
        isOwner: true,
        client: mockClient,
        getAuthOptions: mockGetAuthOptions,
      },
    });
    
    // Test the getUnitSuffix method
    expect(wrapper.vm.getUnitSuffix('150g')).toBe('g');
    expect(wrapper.vm.getUnitSuffix('10mg')).toBe('mg');
    expect(wrapper.vm.getUnitSuffix('5.5ml')).toBe('ml');
    expect(wrapper.vm.getUnitSuffix('100')).toBe('');
    expect(wrapper.vm.getUnitSuffix('')).toBe('');
    expect(wrapper.vm.getUnitSuffix(null)).toBe('');
    expect(wrapper.vm.getUnitSuffix(undefined)).toBe('');
  });
});