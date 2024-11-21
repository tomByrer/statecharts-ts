type ConfigNode = {
  id: string;
  children?: ConfigNode[];
};

type Config = {
  id: 'root';
  children: [
    {
      id: 'child1';
      children: [{ id: 'grandchild1' }, { id: 'grandchild2' }];
    },
    {
      id: 'child2';
      children: [{ id: 'grandchild3' }];
    },
  ];
};

// Helper to recursively infer all valid paths
type GetPaths<
  T extends { id: string; children?: any },
  Prefix extends string = '',
> = T extends { children: infer Children }
  ? Children extends ConfigNode[]
    ? `${Prefix}${T['id']}` | `${Prefix}${T['id']}/${GetChildPaths<Children>}`
    : `${Prefix}${T['id']}`
  : `${Prefix}${T['id']}`;

type GetChildPaths<T extends ConfigNode[]> = T extends [
  infer First,
  ...infer Rest,
]
  ? First extends ConfigNode
    ? Rest extends ConfigNode[]
      ? GetPaths<First> | GetChildPaths<Rest>
      : GetPaths<First>
    : never
  : never;

type ValidPaths = GetPaths<Config>;

class TreeNode {
  id: string;
  parent: TreeNode | null = null;
  children: Map<string, TreeNode> = new Map();

  constructor(id: string) {
    this.id = id;
  }

  addChild(child: TreeNode) {
    child.parent = this;
    this.children.set(child.id, child);
  }
}

class Tree {
  root: TreeNode;

  constructor(config: ConfigNode) {
    this.root = this.buildTree(config);
  }

  private buildTree(
    config: ConfigNode,
    parent: TreeNode | null = null,
  ): TreeNode {
    const node = new TreeNode(config.id);
    node.parent = parent;

    if (config.children) {
      for (const childConfig of config.children) {
        const childNode = this.buildTree(childConfig, node);
        node.addChild(childNode);
      }
    }

    return node;
  }

  getNodeByAbsolutePath(path: ValidPaths): TreeNode | null {
    const parts = path.split('/').filter(Boolean);
    let current: TreeNode | null = this.root;

    for (const part of parts) {
      current = current.children.get(part) || null;
      if (!current) return null;
    }

    return current;
  }
}

const config: Config = {
  id: 'root',
  children: [
    {
      id: 'child1',
      children: [{ id: 'grandchild1' }, { id: 'grandchild2' }],
    },
    {
      id: 'child2',
      children: [{ id: 'grandchild3' }],
    },
  ],
};

const tree = new Tree(config);

const node1 = tree.getNodeByAbsolutePath('root/child1/grandchild1'); // Autocompletes
const node2 = tree.getNodeByAbsolutePath('root/child2/grandchild3'); // Autocompletes
const invalidNode = tree.getNodeByAbsolutePath('root/invalid'); // TypeScript Error
