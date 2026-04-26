import { createRsbuild, type RsbuildConfig, type Rspack } from '../src';
import { CSS_REGEX, JS_REGEX } from '../src/constants';
import { normalizeRuleConditionPath } from '../src/helpers/path';

const isExtractRule = (
  rule: Rspack.RuleSetRules[number],
): rule is Rspack.RuleSetRule =>
  !!rule &&
  typeof rule === 'object' &&
  'extractSourceMap' in rule &&
  rule.extractSourceMap === true;

const getExtractRules = async (
  config?: RsbuildConfig,
): Promise<Rspack.RuleSetRule[]> => {
  const rsbuild = await createRsbuild({
    config,
  });
  const [bundlerConfig] = await rsbuild.initConfigs();

  return bundlerConfig.module?.rules?.filter(isExtractRule) || [];
};

const findRuleByTest = (
  rules: Rspack.RuleSetRule[],
  test: Rspack.RuleSetCondition,
) => rules.find((item) => item.test?.toString() === test.toString());

describe('plugin-source-map', () => {
  it('should not add extract rules by default', async () => {
    const rules = await getExtractRules();

    expect(rules).toHaveLength(0);
  });

  it('should add JavaScript extract rule when output.sourceMap.extract.js is true', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            js: true,
          },
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: JS_REGEX,
      }),
    );
  });

  it('should not add extract rules when output.sourceMap.extract.js is false', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            js: false,
          },
        },
      },
    });

    expect(rules).toHaveLength(0);
  });

  it('should add JavaScript extract rule when output.sourceMap.extract is true', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: true,
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: JS_REGEX,
      }),
    );
    expect(rules).toHaveLength(1);
  });

  it('should add JavaScript extract rule when output.sourceMap.extract is js string', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: 'js',
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: JS_REGEX,
      }),
    );
    expect(rules).toHaveLength(1);
  });

  it('should add JavaScript extract rule when output.sourceMap.extract.type is js', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            type: 'js',
          },
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: JS_REGEX,
      }),
    );
    expect(rules).toHaveLength(1);
  });

  it('should add JavaScript extract rule when output.sourceMap.extract is empty object', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {},
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: JS_REGEX,
      }),
    );
    expect(rules).toHaveLength(1);
  });

  it('should add CSS extract rule when output.sourceMap.extract is css string', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: 'css',
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: CSS_REGEX,
      }),
    );
    expect(rules).toHaveLength(1);
  });

  it('should add CSS extract rule when output.sourceMap.extract.type is css', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            type: 'css',
          },
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: CSS_REGEX,
      }),
    );
    expect(rules).toHaveLength(1);
  });

  it('should add all extract rule when output.sourceMap.extract is all string', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: 'all',
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: [JS_REGEX, CSS_REGEX],
      }),
    );
    expect(rules).toHaveLength(1);
  });

  it('should add all extract rule when output.sourceMap.extract.type is all', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            type: 'all',
          },
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: [JS_REGEX, CSS_REGEX],
      }),
    );
    expect(rules).toHaveLength(1);
  });

  it('should apply custom test to extract rules', async () => {
    const test = /custom-source-map/;

    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            test,
          },
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test,
      }),
    );
    expect(rules).toHaveLength(1);
  });

  it('should apply include matchers to extract rules', async () => {
    const include = ['C:/workspace/pkg', /foo/];

    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            include,
          },
        },
      },
    });

    const rule = findRuleByTest(rules, JS_REGEX);

    expect(rule).toEqual(
      expect.objectContaining({
        include: include.map(normalizeRuleConditionPath),
      }),
    );
  });

  it('should apply exclude matchers to extract rules', async () => {
    const exclude = ['C:/workspace/pkg/exclude', /bar/];

    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            exclude,
          },
        },
      },
    });

    const rule = findRuleByTest(rules, JS_REGEX);

    expect(rule).toEqual(
      expect.objectContaining({
        exclude: exclude.map(normalizeRuleConditionPath),
      }),
    );
  });

  it('should support deprecated include matchers from output.sourceMap.extract.js', async () => {
    const include = ['C:/workspace/pkg', /foo/];

    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            js: {
              include,
            },
          },
        },
      },
    });

    const rule = findRuleByTest(rules, JS_REGEX);

    expect(rule).toEqual(
      expect.objectContaining({
        include: include.map(normalizeRuleConditionPath),
      }),
    );
  });

  it('should support deprecated exclude matchers from output.sourceMap.extract.js', async () => {
    const exclude = ['C:/workspace/pkg/exclude', /bar/];

    const rules = await getExtractRules({
      output: {
        sourceMap: {
          extract: {
            js: {
              exclude,
            },
          },
        },
      },
    });

    const rule = findRuleByTest(rules, JS_REGEX);

    expect(rule).toEqual(
      expect.objectContaining({
        exclude: exclude.map(normalizeRuleConditionPath),
      }),
    );
  });

  it('should keep JavaScript extract rules when output.sourceMap.js is false', async () => {
    const rules = await getExtractRules({
      output: {
        sourceMap: {
          js: false,
          extract: {
            js: true,
          },
        },
      },
    });

    expect(rules).toContainEqual(
      expect.objectContaining({
        extractSourceMap: true,
        test: JS_REGEX,
      }),
    );
  });
});
