<script setup lang="ts">
import { useOfferStore, type WizardStep } from '~/stores/offer'

defineProps<{ step: WizardStep }>()

const { locale, t } = useI18n()
const offer = useOfferStore()
const localePath = useLocalePath()

const label = (field: { label_de: string; label_en: string }) =>
  locale.value === 'en' ? field.label_en : field.label_de

const placeholder = (field: { placeholder_de: string; placeholder_en: string }) =>
  locale.value === 'en' ? field.placeholder_en : field.placeholder_de

function getValue(fieldName: string): string {
  const val = offer.getContactField(fieldName)
  return typeof val === 'string' ? val : ''
}

function getChecked(fieldName: string): boolean {
  const val = offer.getContactField(fieldName)
  return val === true
}

function hasError(fieldName: string): boolean {
  return !!offer.fieldErrors[fieldName]
}

function getError(fieldName: string): string {
  return offer.fieldErrors[fieldName] || ''
}

function onInput(fieldName: string, value: string | boolean) {
  offer.setContactField(fieldName, value)
  offer.clearFieldError(fieldName)
}
</script>

<template>
  <section>
    <h3 class="text-base font-semibold text-ink-900 sm:text-lg">
      {{ locale === 'en' ? step.title_en : step.title_de }}
    </h3>
    <p v-if="step.subtitle_de || step.subtitle_en" class="mt-1 text-sm text-ink-500">
      {{ locale === 'en' ? step.subtitle_en : step.subtitle_de }}
    </p>

    <div class="mt-5 space-y-4">
      <template v-for="field in step.contact_fields" :key="field.field_name">
        <!-- Text/Email/Tel inputs -->
        <div v-if="field.field_type === 'text' || field.field_type === 'email' || field.field_type === 'tel'">
          <label class="label">
            {{ label(field) }}
            <span v-if="field.is_required" class="text-red-500">*</span>
          </label>
          <input
            :type="field.field_type"
            :value="getValue(field.field_name)"
            :placeholder="placeholder(field)"
            class="input"
            :class="{ 'border-red-500 ring-1 ring-red-500': hasError(field.field_name) }"
            @input="(e) => onInput(field.field_name, (e.target as HTMLInputElement).value)"
          />
          <p v-if="hasError(field.field_name)" class="mt-1 text-sm text-red-600">
            {{ getError(field.field_name) }}
          </p>
        </div>

        <!-- Textarea -->
        <div v-else-if="field.field_type === 'textarea'">
          <label class="label">
            {{ label(field) }}
            <span v-if="field.is_required" class="text-red-500">*</span>
          </label>
          <textarea
            :value="getValue(field.field_name)"
            :placeholder="placeholder(field)"
            rows="3"
            class="input resize-none"
            :class="{ 'border-red-500 ring-1 ring-red-500': hasError(field.field_name) }"
            @input="(e) => onInput(field.field_name, (e.target as HTMLTextAreaElement).value)"
          />
          <p v-if="hasError(field.field_name)" class="mt-1 text-sm text-red-600">
            {{ getError(field.field_name) }}
          </p>
        </div>

        <!-- Checkbox (consent) -->
        <div v-else-if="field.field_type === 'checkbox'">
          <div class="flex items-start gap-3">
            <input
              :id="field.field_name"
              type="checkbox"
              :checked="getChecked(field.field_name)"
              class="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              :class="hasError(field.field_name) ? 'border-red-500 ring-1 ring-red-500' : 'border-ink-300'"
              @change="(e) => onInput(field.field_name, (e.target as HTMLInputElement).checked)"
            />
            <label :for="field.field_name" class="text-sm" :class="hasError(field.field_name) ? 'text-red-700' : 'text-ink-700'">
              <template v-if="field.field_name === 'consent'">
                {{ t('offer.step4.consent', { link: '' }).split('{link}')[0] }}
                <NuxtLink :to="localePath('/datenschutz')" class="text-brand-600 underline" target="_blank">
                  {{ t('offer.step4.consent_link') }}
                </NuxtLink>
                {{ t('offer.step4.consent', { link: '' }).split('{link}')[1] }}
              </template>
              <template v-else>
                {{ label(field) }}
                <span v-if="field.is_required" class="text-red-500">*</span>
              </template>
            </label>
          </div>
          <p v-if="hasError(field.field_name)" class="mt-1 ml-7 text-sm text-red-600">
            {{ getError(field.field_name) }}
          </p>
        </div>
      </template>

      <!-- Honeypot -->
      <input
        v-model="offer.honeypot"
        type="text"
        name="website"
        autocomplete="off"
        tabindex="-1"
        class="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
    </div>
  </section>
</template>
