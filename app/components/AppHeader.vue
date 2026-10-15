<template>
    <div v-if="user" class="card">
        <Menubar :model="items">
            <template #item="{ item, props, hasSubmenu, root }">
                <NuxtLink v-if="item.to" class="flex items-center" :to="item.to" v-bind="props.action">
                    <span>{{ item.label }}</span>
                    <span
v-if="item.shortcut"
                        class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">{{
                        item.shortcut }}</span>
                    <i
v-if="hasSubmenu" :class="[
                        'pi pi-angle-down ml-auto',
                        { 'pi-angle-down': root, 'pi-angle-right': !root },
                    ]"></i>
                </NuxtLink>
                <a v-else class="flex items-center" href="#" v-bind="props.action" @click.prevent>
                    <span>{{ item.label }}</span>
                    <i
v-if="hasSubmenu" :class="[
                        'pi pi-angle-down ml-auto',
                        { 'pi-angle-down': root, 'pi-angle-right': !root },
                    ]"></i>
                </a>
            </template>
            <template #end>
                <div v-if="picture" class="flex items-center">
                    <Avatar :image="picture" shape="circle" />
                </div>
            </template>
        </Menubar>
    </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const picture = computed<string | null>(() => {
    const md = (user.value as any)?.user_metadata
    return md?.picture ?? md?.avatar_url ?? null
})

async function logout() {
    await supabase.auth.signOut()
    await navigateTo('/login')
}

const items = [
    {
        label: 'Dashboard',
        icon: 'pi pi-home',
        to: '/',
    },
    {
        label: 'Settings',
        icon: 'pi pi-cog',
        items: [
            {
                label: 'Configure Tournament',
                icon: 'pi pi-bolt',
                to: '/setup'
            },
            {
                separator: true
            },
            {
                label: 'League (coming soon)',
                icon: 'pi pi-pencil',
                disabled: true
            }
        ]
    },
    {
        label: 'Logout',
        command: logout
    }
]
</script>
