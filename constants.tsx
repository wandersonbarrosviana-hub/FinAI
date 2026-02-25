
import React from 'react';
import {
  LogOut,
  Bell,
  Settings,
  X
} from 'lucide-react';
import * as Icons from './components/icons/ColorfulIcons';
import { ViewState } from './types';

export const NAV_ITEMS = [
  { id: 'admin' as ViewState, label: 'Administrador', icon: <Icons.AdminIcon size={20} /> },
  { id: 'dashboard' as ViewState, label: 'Dashboard', icon: <Icons.DashboardIcon size={20} /> },
  { id: 'financial-assessment' as ViewState, label: 'Avaliação Financeira', icon: <Icons.AssessmentIcon size={20} /> },
  { id: 'transactions' as ViewState, label: 'Transações', icon: <Icons.TransactionsIcon size={20} /> },
  { id: 'debts' as ViewState, label: 'Dívidas', icon: <Icons.DebtsIcon size={20} /> },
  { id: 'investments' as ViewState, label: 'Investimentos', icon: <Icons.InvestmentsIcon size={20} />, badge: 'Em breve' },
  { id: 'credit-cards' as ViewState, label: 'Cartões', icon: <Icons.CreditCardIcon size={20} /> },
  { id: 'accounts' as ViewState, label: 'Contas', icon: <Icons.WalletIcon size={20} /> },
  { id: 'budgets' as ViewState, label: 'Orçamento', icon: <Icons.BudgetIcon size={20} /> },
  { id: 'custom-budgets' as ViewState, label: 'Orç. Personalizado', icon: <Icons.BudgetIcon size={20} /> },
  { id: 'charts' as ViewState, label: 'Gráficos', icon: <Icons.ChartsIcon size={20} /> },
  { id: 'categories' as ViewState, label: 'Categorias', icon: <Icons.CategoriesIcon size={20} /> },
  { id: 'goals' as ViewState, label: 'Metas', icon: <Icons.GoalsIcon size={20} /> },

  { id: 'ai-assistant' as ViewState, label: 'Assistente Virtual', icon: <Icons.AIAssistantIcon size={20} /> },
  { id: 'retirement' as ViewState, label: 'Aposentadoria', icon: <Icons.RetirementIcon size={20} /> },
  { id: 'reports' as ViewState, label: 'Relatórios', icon: <Icons.ReportsIcon size={20} /> },
  { id: 'plans' as ViewState, label: 'Planos', icon: <Icons.PlansIcon size={20} /> },
];

export const CATEGORIES_MAP: Record<string, string[]> = {
  'Alimentação': ['Supermercado', 'Restaurante', 'Lanche', 'Feira'],
  'Transporte': ['Combustível', 'Uber/Taxi', 'Ônibus/Metrô', 'Manutenção'],
  'Lazer': ['Cinema', 'Viagens', 'Hobbies', 'Shows'],
  'Saúde': ['Farmácia', 'Consulta', 'Exames', 'Academia'],
  'Educação': ['Cursos', 'Livros', 'Mensalidade Escolar'],
  'Moradia': ['Aluguel', 'Condomínio', 'Luz', 'Água', 'Internet'],
  'Investimentos': ['Ações', 'Renda Fixa', 'Cripto', 'Reserva'],
  'Outros': ['Diversos', 'Presentes', 'Taxas']
};

export const INCOME_CATEGORIES_MAP: Record<string, string[]> = {
  'Salário': ['Mensal', 'Adiantamento', '13º Salário', 'Férias'],
  'Freelance': ['Projeto', 'Consultoria', 'Serviço Extra'],
  'Investimentos': ['Dividendos', 'Juros', 'Aluguel (FIIs)', 'Venda de Ativos'],
  'Presentes': ['Aniversário', 'Doação'],
  'Outros': ['Reembolso', 'Venda de Itens', 'Diversos']
};

export const CATEGORIES = Object.keys(CATEGORIES_MAP);

export interface BankInfo {
  id: string;
  name: string;
  color: string;
  logoUrl: string;
}

export const BANKS: BankInfo[] = [
  // Coluna Esquerda - Bancos Tradicionais
  { id: 'itau', name: 'Itaú', color: '#EC7000', logoUrl: '/banks/itau.svg' },
  { id: 'nubank', name: 'Nubank', color: '#8A05BE', logoUrl: '/banks/nubank.svg' },
  { id: 'bradesco', name: 'Bradesco', color: '#CC092F', logoUrl: '/banks/bradesco.svg' },
  { id: 'bb', name: 'Banco do Brasil', color: '#FCF200', logoUrl: '/banks/bb.svg' },
  { id: 'santander', name: 'Santander', color: '#EC0000', logoUrl: '/banks/santander.svg' },
  { id: 'caixa', name: 'Caixa', color: '#005CA9', logoUrl: '/banks/caixa.svg' },
  { id: 'inter', name: 'Inter', color: '#FF7A00', logoUrl: '/banks/inter.svg' },
  { id: 'c6', name: 'C6 Bank', color: '#222222', logoUrl: '/banks/c6.svg' },
  { id: 'safra', name: 'Safra', color: '#AF9049', logoUrl: '/banks/safra.svg' },
  { id: 'pan', name: 'Banco Pan', color: '#00AEEF', logoUrl: '/banks/pan.svg' },
  { id: 'pagbank', name: 'PagBank', color: '#35C24D', logoUrl: '/banks/pagbank.svg' },

  // Coluna Direita - Corretoras
  { id: 'xp', name: 'XP Investimentos', color: '#000000', logoUrl: '/banks/xp.svg' },
  { id: 'rico', name: 'Rico', color: '#FF4500', logoUrl: '/banks/rico.svg' },
  { id: 'clear', name: 'Clear', color: '#00FFFF', logoUrl: '/banks/clear.svg' },
  { id: 'avenue', name: 'Avenue', color: '#003A70', logoUrl: '/banks/avenue.svg' },
  { id: 'warren', name: 'Warren', color: '#EE2E5D', logoUrl: '/banks/warren.svg' },
  { id: 'toro', name: 'Toro Investimentos', color: '#6227B1', logoUrl: '/banks/toro.svg' },
  { id: 'nuinvest', name: 'NuInvest', color: '#8A05BE', logoUrl: '/banks/nuinvest.svg' },
  { id: 'modalmais', name: 'Modalmais', color: '#141414', logoUrl: '/banks/modalmais.svg' },

  // Bandeiras / Benefícios
  { id: 'visa', name: 'Visa', color: '#1A1F71', logoUrl: '/banks/visa.svg' },
  { id: 'mastercard', name: 'Mastercard', color: '#EB001B', logoUrl: '/banks/mastercard.svg' },
  { id: 'elo', name: 'Elo', color: '#00A4E0', logoUrl: '/banks/elo.svg' },
  { id: 'amex', name: 'American Express', color: '#2E77BC', logoUrl: '/banks/amex.svg' },
  { id: 'hipercard', name: 'Hipercard', color: '#BE0000', logoUrl: '/banks/hipercard.svg' },
  { id: 'ticket', name: 'Ticket', color: '#CE0058', logoUrl: '/banks/ticket.svg' }, // Updated Link
  { id: 'alelo', name: 'Alelo', color: '#006748', logoUrl: '/banks/alelo.svg' },
  { id: 'sodexo', name: 'Sodexo', color: '#5C5FBA', logoUrl: '/banks/sodexo.svg' },
  { id: 'vr', name: 'VR Benefícios', color: '#00AA13', logoUrl: '/banks/vr.svg' }, // Fallback to PNG or find SVG. Using external consistent link if possible.

  // Especiais
  {
    id: 'carteira',
    name: 'Carteira (Dinheiro)',
    color: '#334155',
    logoUrl: '/banks/carteira.svg'
  },
  {
    id: 'outro',
    name: 'Outro',
    color: '#64748b',
    logoUrl: '/banks/outro.svg'
  }
];

export const CARD_NETWORKS = BANKS.filter(b => ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'ticket', 'alelo', 'sodexo', 'vr'].includes(b.id));


export const THEMES = [
  { id: 'ocean', name: 'Oceano', primary: '#0284c7', soft: '#e0f2fe', glow: 'rgba(2, 132, 199, 0.15)', dark: '#0369a1' },
  { id: 'emerald', name: 'Esmeralda', primary: '#10b981', soft: '#ecfdf5', glow: 'rgba(16, 185, 129, 0.15)', dark: '#059669' },
  { id: 'ruby', name: 'Rubi', primary: '#e11d48', soft: '#fff1f2', glow: 'rgba(225, 29, 72, 0.15)', dark: '#be123c' },
  { id: 'sunset', name: 'Sunset', primary: '#f59e0b', soft: '#fffbeb', glow: 'rgba(245, 158, 11, 0.15)', dark: '#d97706' },
  { id: 'obsidian', name: 'Obsidiana', primary: '#1e293b', soft: '#f1f5f9', glow: 'rgba(30, 41, 59, 0.15)', dark: '#0f172a' },
  { id: 'violet', name: 'Violeta', primary: '#7c3aed', soft: '#f5f3ff', glow: 'rgba(124, 58, 237, 0.15)', dark: '#6d28d9' }
];
