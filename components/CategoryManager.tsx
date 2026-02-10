
import React, { useState, useEffect } from 'react';
import {
    Plus,
    MoreVertical,
    Trash2,
    Edit2,
    Save,
    X,
    FolderOpen,
    ShoppingBag,
    Briefcase,
    Home,
    Utensils,
    Car,
    Plane,
    Heart,
    BookOpen,
    DollarSign,
    Coffee,
    Smartphone,
    Gift,
    Music,
    Film,
    Zap,
    Droplet,
    Wifi,
    Monitor,
    Gamepad,
    Dumbbell,
    GraduationCap,
    Hammer,
    Baby,
    Dog,
    Cat,
    Fish,
    Bus,
    Train,
    Bike,
    CreditCard,
    Banknote,
    Landmark,
    PiggyBank,
    TrendingUp,
    TrendingDown,
    Activity,
    AlertCircle,
    Anchor,
    Archive,
    Award,
    Backpack,
    Bath,
    Beer,
    Bell,
    Bike as Bicycle,
    Bird,
    Bitcoin,
    Book,
    Box,
    Brain,
    Brush,
    Bug,
    Building,
    BusFront,
    Cake,
    Calculator,
    Calendar,
    Camera,
    Candy,
    CarFront,
    Carrot,
    Castle,
    Cat as CatIcon,
    Check,
    CheckCircle,
    ChefHat,
    Cherry,
    ChevronDown,
    ChevronUp,
    CircleDollarSign,
    Cloud,
    CloudRain,
    CloudSun,
    Code,
    Coins,
    Compass,
    ConciergeBell,
    Construction,
    Contact,
    Cookie,
    Copy,
    Copyright,
    CornerDownRight,
    Cpu,
    Croissant,
    Crosshair,
    Crown,
    CupSoda,
    Database,
    Diamond,
    Dice1,
    Dna,
    Dog as DogIcon,
    DoorOpen,
    Download,
    Dribbble,
    Drumstick,
    Ear,
    Egg,
    Eye,
    Factory,
    Fan,
    Feather,
    FerrisWheel,
    File,
    FileText,
    Filter,
    Flame,
    Flashlight,
    Flower,
    Flower2,
    Focus,
    Folder,
    Footprints,
    Forklift,
    Frown,
    Fuel,
    FunctionSquare,
    Gamepad2,
    Gem,
    Ghost,
    Gift as GiftIcon,
    GitBranch,
    Glasses,
    Globe,
    Grab,
    GraduationCap as GradCap,
    Grape,
    Grid,
    Hammer as HammerIcon,
    HandCoins,
    HardDrive,
    Hash,
    Haze,
    Headphones,
    HeartHandshake,
    HeartPulse,
    HelpCircle,
    Hexagon,
    Highlighter,
    History,
    Home as HomeIcon,
    Hourglass,
    IceCream,
    Image,
    Inbox,
    Infinity,
    Info,
    InspectionPanel,
    Instagram,
    Italic,
    Joystick,
    Key,
    Keyboard,
    Lamp,
    Landmark as LandmarkIcon,
    Languages,
    Laptop,
    Laptop2,
    Layers,
    Layout,
    LayoutDashboard,
    LayoutGrid,
    Leaf,
    Library,
    LifeBuoy,
    Lightbulb,
    Link,
    Linkedin,
    List,
    ListChecks,
    ListMusic,
    ListOrdered,
    ListPlus,
    ListTodo,
    ListVideo,
    ListX,
    Loader,
    Loader2,
    Lock,
    LockKeyhole,
    LogIn,
    LogOut,
    Lollipop,
    Luggage,
    Magnet,
    Mail,
    Mailbox,
    Map,
    MapPin,
    Martini,
    Maximize,
    Maximize2,
    Medal,
    Megaphone,
    Menu,
    MessageCircle,
    MessageSquare,
    Mic,
    Mic2,
    Microscope,
    Microwave,
    Milestone,
    Milk,
    Minimize,
    Minimize2,
    Minus,
    MinusCircle,
    Monitor as MonitorIcon,
    Moon,
    MoreHorizontal,
    Mountain,
    MountainSnow,
    Mouse,
    Move,
    Move3d,
    MoveDiagonal,
    MoveDiagonal2,
    MoveHorizontal,
    MoveVertical,
    Music2,
    Music3,
    Music4,
    Navigation,
    Network,
    Newspaper,
    Nfc,
    Nut,
    Octagon,
    Option,
    Orbit,
    Origami,
    Package,
    Package2,
    PackageCheck,
    PackageMinus,
    PackageOpen,
    PackagePlus,
    PackageSearch,
    PackageX,
    PaintBucket,
    Paintbrush,
    Paintbrush2,
    Palette,
    Palmtree,
    PanelBottom,
    PanelLeft,
    PanelRight,
    PanelTop,
    Paperclip,
    Parentheses,
    PartyPopper,
    Pause,
    PauseCircle,
    PawPrint,
    Pen,
    PenLine,
    PenTool,
    Pencil,
    PencilLine,
    PencilRuler,
    Percent,
    PersonStanding,
    Phone,
    PhoneCall,
    PhoneForwarded,
    PhoneIncoming,
    PhoneMissed,
    PhoneOff,
    PhoneOutgoing,
    PieChart,
    PiggyBank as Piggy,
    Pilcrow,
    Pill,
    Pin,
    PinOff,
    Pipette,
    Pizza,
    Plane as PlaneIcon,
    PlaneLanding,
    PlaneTakeoff,
    Play,
    PlayCircle,
    Plug,
    Plug2,
    PlusCircle,
    PlusSquare,
    Pocket,
    Podcast,
    Pointer,
    Popcorn,
    Popsicle,
    PoundSterling,
    Power,
    PowerOff,
    Presentation,
    Printer,
    Projector,
    Puzzle,
    QrCode,
    Quote,
    Rabbit,
    Radar,
    Radiation,
    Radio,
    RadioReceiver,
    RadioTower,
    Radius,
    RailSymbol,
    Rainbow,
    Rat,
    Ratio,
    Receipt,
    RectangleHorizontal,
    RectangleVertical,
    Recycle,
    Redo,
    Redo2,
    RefreshCcw,
    RefreshCw,
    Refrigerator,
    Regex,
    RemoveFormatting,
    Repeat,
    Repeat1,
    Repeat2,
    Replace,
    ReplaceAll,
    Reply,
    ReplyAll,
    Rewind,
    Rocket,
    RockingChair,
    RollerCoaster,
    Rotate3d,
    RotateCcw,
    RotateCw,
    Route,
    Router,
    Rows,
    Rss,
    Ruler,
    RussianRuble,
    Sailboat,
    Salad,
    Sandwich,
    Satellite,
    SatelliteDish,
    Save as SaveIcon,
    SaveAll,
    Scale,
    Scale3d,
    Scaling,
    Scan,
    ScanBarcode,
    ScanEye,
    ScanFace,
    ScanLine,
    ScanSearch,
    ScanText,
    ScatterChart,
    School,
    School2,
    Scissors,
    ScreenShare,
    ScreenShareOff,
    Scroll,
    ScrollText,
    Search,
    SearchCheck,
    SearchCode,
    SearchSlash,
    SearchX,
    Send,
    SeparatorHorizontal,
    SeparatorVertical,
    Server,
    ServerCog,
    ServerCrash,
    ServerOff,
    Settings,
    Settings2,
    Share,
    Share2,
    Sheet,
    Shell,
    Shield,
    ShieldAlert,
    ShieldCheck,
    ShieldClose,
    ShieldOff,
    ShieldQuestion,
    Ship,
    ShipWheel,
    Shirt,
    ShoppingBag as ShoppingBagIcon,
    ShoppingBasket,
    ShoppingCart,
    Shovel,
    ShowerHead,
    Shrink,
    Shuffle,
    Sigma,
    Signal,
    SignalHigh,
    SignalLow,
    SignalMedium,
    SignalZero,
    Siren,
    SkipBack,
    SkipForward,
    Skull,
    Slack,
    Slash,
    Slice,
    Sliders,
    SlidersHorizontal,
    Smartphone as SmartphoneIcon,
    SmartphoneCharging,
    SmartphoneNfc,
    Smile,
    SmilePlus,
    Snowflake,
    Sofa,
    Soup,
    Space,
    Spade,
    Sparkle,
    Sparkles,
    Speaker,
    Speech,
    SpellCheck,
    Spline,
    Split,
    SplitSquareHorizontal,
    SplitSquareVertical,
    SprayCan,
    Sprout,
    Square,
    SquareAsterisk,
    SquareCode,
    SquareDashedBottom,
    SquareDashedBottomCode,
    SquareDot,
    SquareEqual,
    SquareSlash,
    SquareStack,
    SquareUser,
    SquareUserRound,
    Stamp,
    Star,
    StarHalf,
    StarOff,
    StepBack,
    StepForward,
    Stethoscope,
    Sticker,
    StickyNote,
    StopCircle,
    Store,
    StretchHorizontal,
    StretchVertical,
    Strikethrough,
    Subscript,
    Subtitles,
    Sun,
    SunDim,
    SunMedium,
    SunMoon,
    SunSnow,
    Sunrise,
    Sunset,
    Superscript,
    SwissFranc,
    SwitchCamera,
    Sword,
    Swords,
    Syringe,
    Table,
    Table2,
    Tablet,
    TabletSmartphone,
    Tag,
    Tags,
    Target,
    Tent,
    TentTree,
    Terminal,
    TerminalSquare,
    TestTube,
    TestTube2,
    Text,
    TextCursor,
    TextCursorInput,
    TextQuote,
    TextSelect,
    Theater,
    Thermometer,
    ThermometerSnowflake,
    ThermometerSun,
    ThumbsDown,
    ThumbsUp,
    Ticket,
    Timer,
    TimerOff,
    TimerReset,
    ToggleLeft,
    ToggleRight,
    Tornado,
    Torus,
    Touchpad,
    TouchpadOff,
    TowerControl,
    ToyBrick,
    Tractor,
    TrafficCone,
    TrainFront,
    TrainTrack,
    TramFront,
    Trash,
    Trash2 as TrashIcon,
    TreeDeciduous,
    TreePine,
    Trees,
    Trello,
    TrendingUp as TrendingUpIcon,
    Triangle,
    Trophy,
    Truck,
    Tv,
    Tv2,
    Twitch,
    Twitter,
    Type,
    Umbrella,
    Underline,
    Undo,
    Undo2,
    UnfoldHorizontal,
    UnfoldVertical,
    Ungroup,
    Unlink,
    Unlink2,
    Unlock,
    UnlockKeyhole,
    Upload,
    UploadCloud,
    Usb,
    User,
    UserCheck,
    UserCog,
    UserMinus,
    UserPlus,
    UserX,
    Users,
    Users2,
    Utensils as UtensilsIcon,
    UtensilsCrossed,
    UtilityPole,
    Variable,
    Vault,
    Vegan,
    VenetianMask,
    Vibrate,
    VibrateOff,
    Video,
    VideoOff,
    Videotape,
    View,
    Voicemail,
    Volume,
    Volume1,
    Volume2,
    VolumeX,
    Vote,
    Wallet,
    Wallet2,
    WalletCards,
    Wallpaper,
    Wand,
    Wand2,
    Warehouse,
    WashingMachine,
    Watch,
    Waves,
    Waypoints,
    Webcam,
    Webhook,
    Weight,
    Wheat,
    WheatOff,
    WholeWord,
    Wifi as WifiIcon,
    WifiOff,
    Wind,
    Wine,
    WineOff,
    Workflow,
    WrapText,
    Wrench,
    X as XIcon,
    XCircle,
    XOctagon,
    XSquare,
    Youtube,
    Zap as ZapIcon,
    ZapOff,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import { Transaction } from '../types';
import { CATEGORIES_MAP } from '../constants';

interface CategoryManagerProps {
    transactions: Transaction[];
}

interface CategoryState {
    [category: string]: string[];
}

interface IconState {
    [key: string]: string;
}

// Extensive Icon Map
const ICON_MAP: any = {
    ShoppingBag, Briefcase, Home, Utensils, Car, Plane, Heart, BookOpen,
    DollarSign, Coffee, Smartphone, Gift, Music, Film, Zap, Droplet,
    Wifi, Monitor, Gamepad, Dumbbell, GraduationCap, Hammer, Baby, Dog,
    Cat, Fish, Bus, Train, Bike, CreditCard, Banknote, Landmark, PiggyBank,
    TrendingUp, TrendingDown, Activity, AlertCircle, Award, Beer, Bell,
    Calendar, Camera, CheckCircle, Cloud, Code, Coins, Crown, Database,
    Diamond, Eye, Factory, FileText, Flag: FolderOpen, Flame, Flashlight,
    Flower, Ghost, Globe, Headphones, Image, Key, Laptop, Layers, Layout,
    Lightbulb, Link, Lock, Mail, MapPin, Medal, MessageCircle, Mic, Moon,
    Mouse, Package, Paintbrush, Palette, Paperclip, Phone, PieChart,
    PlayCircle, Power, Printer, Puzzle, Radio, Rocket, Ruler, Save: SaveIcon,
    Scissors, Search, Server, Settings, Share, Shield, Shirt, ShoppingCart,
    Signal, Skull, Smile, Speaker, Star, Sun, Table, Tag, Target, Terminal,
    Thermometer, ThumbsUp, Ticket, Timer, Tool: Wrench, Trash: TrashIcon,
    Trophy, Truck, Tv, Umbrella, Unlock, Upload, User, Users, Video,
    Wallet, Watch, Wifi: WifiIcon, Wrench, Zap: ZapIcon, ZoomIn
};

const ICON_KEYS = Object.keys(ICON_MAP).sort();

const CategoryManager: React.FC<CategoryManagerProps> = ({ transactions }) => {
    // Load initial categories
    const [categories, setCategories] = useState<CategoryState>(() => {
        const saved = localStorage.getItem('finai_categories');
        return saved ? JSON.parse(saved) : CATEGORIES_MAP;
    });

    // Load Icons
    const [icons, setIcons] = useState<IconState>(() => {
        const saved = localStorage.getItem('finai_category_icons');
        return saved ? JSON.parse(saved) : {};
    });

    // UI States
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    // Editing / Creating States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<'category' | 'subcategory' | null>(null);
    const [targetCategory, setTargetCategory] = useState<string>('');
    const [editValue, setEditValue] = useState('');
    const [newValue, setNewValue] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('ShoppingBag');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Effects ---
    useEffect(() => {
        localStorage.setItem('finai_categories', JSON.stringify(categories));
        window.dispatchEvent(new Event('storage'));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem('finai_category_icons', JSON.stringify(icons));
    }, [icons]);

    // --- Helpers ---
    const calculateTotal = (category: string, subCategory?: string) => {
        // transactions passed are ALREADY filtered by Global Date from App.tsx
        return transactions
            .filter(t => {
                if (t.type !== 'expense') return false;
                if (subCategory) return t.category === category && t.subCategory === subCategory;
                return t.category === category;
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);
    };

    const getIcon = (key: string) => {
        const iconName = icons[key];
        const IconComponent = ICON_MAP[iconName] || FolderOpen;
        return <IconComponent size={20} />;
    };

    // --- CRUD Operations ---

    // 1. Add Category
    const handleAddCategory = () => {
        if (!newValue.trim()) return;
        if (categories[newValue]) return alert('Categoria já existe!');

        setCategories(prev => ({ ...prev, [newValue]: [] }));
        setIcons(prev => ({ ...prev, [newValue]: selectedIcon }));
        closeModal();
    };

    // 2. Add Subcategory
    const handleAddSubcategory = () => {
        if (!newValue.trim()) return;
        if (!targetCategory) return;
        const currentSubs = categories[targetCategory] || [];
        if (currentSubs.includes(newValue)) return alert('Subcategoria já existe!');

        setCategories(prev => ({
            ...prev,
            [targetCategory]: [...currentSubs, newValue]
        }));
        setIcons(prev => ({ ...prev, [`${targetCategory}-${newValue}`]: selectedIcon }));
        closeModal();
    };

    // 3. Edit (Rename)
    const handleEdit = () => {
        if (!newValue.trim()) return;

        if (editingType === 'category') {
            const subs = categories[editValue];
            const newCats = { ...categories };
            delete newCats[editValue];
            newCats[newValue] = subs;
            setCategories(newCats);

            // Update Icon Key
            const newIcons = { ...icons };
            newIcons[newValue] = selectedIcon; // Update icon
            if (editValue !== newValue) delete newIcons[editValue];
            setIcons(newIcons);

        } else if (editingType === 'subcategory') {
            const subs = categories[targetCategory].map(s => s === editValue ? newValue : s);
            setCategories(prev => ({ ...prev, [targetCategory]: subs }));

            // Update Icon Key
            const newIcons = { ...icons };
            newIcons[`${targetCategory}-${newValue}`] = selectedIcon;
            if (editValue !== newValue) delete newIcons[`${targetCategory}-${editValue}`];
            setIcons(newIcons);
        }
        closeModal();
    };

    // 4. Delete
    const handleDelete = (type: 'category' | 'subcategory', cat: string, sub?: string) => {
        if (!confirm('Tem certeza? Isso pode afetar a visualização de transações antigas.')) return;

        if (type === 'category') {
            const newCats = { ...categories };
            delete newCats[cat];
            setCategories(newCats);
            // Clean icons? Maybe, but low priority.
        } else {
            const subs = categories[cat].filter(s => s !== sub);
            setCategories(prev => ({ ...prev, [cat]: subs }));
        }
    };


    // --- UI Handlers ---
    const openAddCategoryModal = () => {
        setEditingType('category');
        setEditValue('');
        setNewValue('');
        setSelectedIcon('ShoppingBag');
        setIsModalOpen(true);
    };

    const openAddSubModal = (cat: string) => {
        setEditingType('subcategory');
        setTargetCategory(cat);
        setEditValue(''); // New (no old value)
        setNewValue('');
        setSelectedIcon('ShoppingBag');
        setIsModalOpen(true);
    };

    const openEditModal = (type: 'category' | 'subcategory', cat: string, sub?: string) => {
        setEditingType(type);
        setTargetCategory(cat);
        setEditValue(sub || cat);
        setNewValue(sub || cat);
        // Load existing icon
        const key = sub ? `${cat}-${sub}` : cat;
        setSelectedIcon(icons[key] || 'ShoppingBag');

        setIsModalOpen(true);
        setMenuOpenId(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingType(null);
        setMenuOpenId(null);
    };

    const filteredIconKeys = ICON_KEYS.filter(key => key.toLowerCase().includes(searchTerm.toLowerCase()));


    return (
        <div className="space-y-6 pb-24">

            {/* 1. Header (Simplificado - sem data) */}
            <div className="flex flex-col items-center justify-center space-y-4 sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 py-4 -mx-4 px-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <FolderOpen className="text-cyan-400" />
                    Gerenciar Categorias
                </h2>
                {/* Date Selector Removed - Using Global App Date */}
            </div>

            {/* 2. Main List */}
            <div className="grid gap-4">
                {Object.entries(categories).map(([category, subcategories]) => {
                    const catTotal = calculateTotal(category);
                    const isExpanded = expandedCategory === category;

                    return (
                        <div key={category} className="bg-slate-900/50 border border-slate-800 rounded-2xl transition-all hover:border-slate-700">

                            {/* Category Header Row */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30 transition-colors rounded-2xl"
                                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon Display */}
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-bold text-lg shadow-sm border border-slate-700/50">
                                        {getIcon(category)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-200">{category}</h3>
                                        <p className="text-xs text-slate-500">{subcategories.length} subcategorias</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="text-xs text-slate-500 block">Gastos</span>
                                        <span className="font-bold text-emerald-400">R$ {catTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="relative" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => setMenuOpenId(menuOpenId === `cat-${category}` ? null : `cat-${category}`)}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {/* Kebab Menu */}
                                        {menuOpenId === `cat-${category}` && (
                                            <div className="absolute right-0 top-full mt-2 w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 animate-in fade-in zoom-in-95">
                                                <button
                                                    onClick={() => openEditModal('category', category)}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 first:rounded-t-xl"
                                                >
                                                    <Edit2 size={14} /> Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('category', category)}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 last:rounded-b-xl"
                                                >
                                                    <Trash2 size={14} /> Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Subcategories List (Collapsible) */}
                            {isExpanded && (
                                <div className="border-t border-slate-800 bg-slate-950/30 p-2 space-y-1 rounded-b-2xl">
                                    {subcategories.map(sub => (
                                        <div key={sub} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 group">
                                            <div className="flex items-center gap-3 pl-2">
                                                <div className="text-slate-500 group-hover:text-cyan-400 transition-colors">
                                                    {getIcon(`${category}-${sub}`)}
                                                </div>
                                                <span className="text-sm text-slate-300">{sub}</span>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-medium text-slate-400">
                                                    R$ {calculateTotal(category, sub).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>

                                                <div className="relative">
                                                    <button
                                                        onClick={() => setMenuOpenId(menuOpenId === `sub-${category}-${sub}` ? null : `sub-${category}-${sub}`)}
                                                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-600 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <MoreVertical size={16} />
                                                    </button>

                                                    {/* Sub Kebab Menu */}
                                                    {menuOpenId === `sub-${category}-${sub}` && (
                                                        <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30">
                                                            <button
                                                                onClick={() => openEditModal('subcategory', category, sub)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 first:rounded-t-xl"
                                                            >
                                                                <Edit2 size={12} /> Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete('subcategory', category, sub)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 last:rounded-b-xl"
                                                            >
                                                                <Trash2 size={12} /> Excluir
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Subcategory Button */}
                                    <button
                                        onClick={() => openAddSubModal(category)}
                                        className="w-full flex items-center justify-center gap-2 p-3 mt-2 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-sm font-bold"
                                    >
                                        <Plus size={16} /> Adicionar Subcategoria
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Floating Action Button (Add Category) */}
            <button
                onClick={openAddCategoryModal}
                className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded-full shadow-lg shadow-cyan-500/30 transition-all transform active:scale-95 z-40 outline-none ring-offset-2 ring-offset-slate-950 focus:ring-2 focus:ring-cyan-500"
                title="Nova Categoria"
            >
                <Plus size={24} />
            </button>

            {/* Modal (Create/Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-white overflow-hidden max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            {editValue ? <Edit2 size={18} className="text-cyan-400" /> : <Plus size={18} className="text-cyan-400" />}
                            {editValue ? 'Editar' : 'Adicionar'} {editingType === 'category' ? 'Categoria' : 'Subcategoria'}
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nome</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (editValue ? handleEdit() : (editingType === 'category' ? handleAddCategory() : handleAddSubcategory()))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                                    placeholder={editingType === 'category' ? "Ex: Investimentos" : "Ex: Ações"}
                                />
                            </div>

                            {/* Icon Picker with Filter */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">Ícone</label>
                                    <input
                                        type="text"
                                        placeholder="Buscar ícone..."
                                        className="bg-slate-950 border border-slate-800 text-xs px-2 py-1 rounded-lg text-white w-32 focus:border-cyan-500 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                                    {filteredIconKeys.map((iconKey) => {
                                        const IconComp = ICON_MAP[iconKey];
                                        const isSelected = selectedIcon === iconKey;
                                        return (
                                            <button
                                                key={iconKey}
                                                onClick={() => setSelectedIcon(iconKey)}
                                                className={`aspect-square flex items-center justify-center rounded-xl border transition-all ${isSelected
                                                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                                                    }`}
                                                title={iconKey}
                                            >
                                                <IconComp size={20} />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {editingType === 'subcategory' && (
                                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                                    <span className="text-xs text-slate-400">Adicionando em:</span>
                                    <p className="font-bold text-cyan-400">{targetCategory}</p>
                                </div>
                            )}

                            <button
                                onClick={() => editValue ? handleEdit() : (editingType === 'category' ? handleAddCategory() : handleAddSubcategory())}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManager;
