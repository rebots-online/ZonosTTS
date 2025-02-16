// Custom babel plugin for enhanced tree shaking
module.exports = function treeshakePlugin() {
  return {
    name: 'tree-shake-plugin',
    visitor: {
      // Remove unused imports
      ImportDeclaration(path) {
        const specifiers = path.node.specifiers;
        const usedSpecifiers = specifiers.filter(specifier => {
          const binding = path.scope.getBinding(specifier.local.name);
          return binding && binding.referenced;
        });

        if (usedSpecifiers.length === 0) {
          path.remove();
        } else if (usedSpecifiers.length !== specifiers.length) {
          path.node.specifiers = usedSpecifiers;
        }
      },

      // Remove unused class methods
      ClassDeclaration(path) {
        const methods = path.node.body.body;
        const usedMethods = methods.filter(method => {
          if (method.type !== 'ClassMethod') return true;
          if (method.key.name === 'constructor') return true;

          const binding = path.scope.getBinding(method.key.name);
          return binding && binding.referenced;
        });

        path.node.body.body = usedMethods;
      },

      // Remove dead code branches
      IfStatement(path) {
        const test = path.node.test;
        if (test.type === 'BooleanLiteral') {
          if (test.value === true) {
            path.replaceWith(path.node.consequent);
          } else {
            if (path.node.alternate) {
              path.replaceWith(path.node.alternate);
            } else {
              path.remove();
            }
          }
        }
      },

      // Remove unreachable code
      Function(path) {
        const body = path.get('body');
        let reachable = true;

        body.traverse({
          ReturnStatement(returnPath) {
            const statements = returnPath.getAllNextSiblings();
            if (statements.length > 0) {
              statements.forEach(statement => statement.remove());
              reachable = false;
            }
          },
        });
      },

      // Remove console.log in production
      CallExpression(path) {
        const callee = path.get('callee');
        if (
          callee.isMemberExpression() &&
          callee.get('object').isIdentifier({ name: 'console' })
        ) {
          const method = callee.get('property').node.name;
          if (['log', 'debug', 'info'].includes(method)) {
            path.remove();
          }
        }
      },
    },
  };
};
